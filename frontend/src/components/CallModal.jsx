import React, { useEffect, useRef, useState, useCallback } from "react";
import { MdCallEnd, MdCall, MdVideoCall, MdMic, MdMicOff, MdVideocam, MdVideocamOff, MdVolumeUp, MdVolumeOff } from "react-icons/md";
import { toast } from "react-toastify";
import socket from "../socket/socket";
import { useDispatch, useSelector } from "react-redux";
import { setCallStatus, setCallData } from "../redux/slices/conditionSlice";
import { getValidImage } from "../utils/getChatName";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
        { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
        { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
    ],
};

const CALLER_TIMEOUT_MS = 40000;
const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

// Web Audio API ringtone — no external URL needed
const createRingtone = () => {
    let ctx = null, interval = null;
    const play = () => {
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            const beep = () => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = "sine"; osc.frequency.value = 480;
                gain.gain.setValueAtTime(0.4, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
                osc.start(); osc.stop(ctx.currentTime + 0.6);
            };
            beep();
            interval = setInterval(beep, 2000);
        } catch (e) { /* ignore */ }
    };
    const stop = () => {
        clearInterval(interval); interval = null;
        ctx?.close().catch(() => {}); ctx = null;
    };
    return { play, stop };
};

const AudioWave = ({ active }) => (
    <div className="flex items-end gap-[3px] h-10">
        {[0.4,0.7,1,0.6,0.9,0.5,0.8,0.4,0.7,1,0.6].map((h,i) => (
            <div key={i} style={{ height: active ? `${h*100}%` : "20%", animation: active ? `wave 1.2s ease-in-out ${i*0.1}s infinite alternate` : "none" }}
                className={`w-[3px] rounded-full transition-all ${active ? "bg-blue-400" : "bg-slate-600"}`} />
        ))}
        <style>{`@keyframes wave{from{transform:scaleY(0.4)}to{transform:scaleY(1)}}`}</style>
    </div>
);

const CallModal = () => {
    const dispatch   = useDispatch();
    const { callStatus, callData } = useSelector((s) => s.condition);
    const authUser   = useSelector((s) => s?.auth);

    const [isMicOn, setIsMicOn]         = useState(true);
    const [isCamOn, setIsCamOn]         = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [duration, setDuration]       = useState(0);
    const [remoteReady, setRemoteReady] = useState(false);

    const localVideoRef  = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerRef        = useRef(null);
    const localRef       = useRef(null);
    const remoteRef      = useRef(null);
    const timerRef       = useRef(null);
    const startTimeRef   = useRef(null);
    const callerTimeoutRef  = useRef(null);
    const iceCandidateQueue = useRef([]);
    const remoteDescSet  = useRef(false);
    const isInitiatorRef = useRef(false);
    const ringtoneRef    = useRef(null);

    // ── Reattach streams whenever callStatus changes (fixes black video on state transition)
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            if (localVideoRef.current && localRef.current) {
                localVideoRef.current.srcObject = localRef.current;
            }
            if (remoteVideoRef.current && remoteRef.current) {
                remoteVideoRef.current.srcObject = remoteRef.current;
                remoteVideoRef.current.play().catch(() => {});
            }
        });
        return () => cancelAnimationFrame(raf);
    }, [callStatus]);

    const startTimer = () => {
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    };
    const stopTimer = () => { clearInterval(timerRef.current); timerRef.current = null; setDuration(0); };

    const stopRingtone = () => ringtoneRef.current?.stop();
    const playRingtone = () => { ringtoneRef.current = createRingtone(); ringtoneRef.current.play(); };

    const attachLocal = (stream) => {
        localRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    };
    const attachRemote = (stream) => {
        remoteRef.current = stream;
        setRemoteReady(true);
        if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = stream; remoteVideoRef.current.play().catch(() => {}); }
    };

    const cleanup = useCallback(() => {
        stopTimer(); stopRingtone();
        clearTimeout(callerTimeoutRef.current); callerTimeoutRef.current = null;
        setRemoteReady(false); remoteDescSet.current = false; iceCandidateQueue.current = [];
        localRef.current?.getTracks().forEach((t) => t.stop());
        remoteRef.current?.getTracks().forEach((t) => t.stop());
        localRef.current = null; remoteRef.current = null;
        if (peerRef.current) { peerRef.current.close(); peerRef.current = null; }
        if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    }, []);

    const drainIceQueue = useCallback(async () => {
        if (!peerRef.current) return;
        while (iceCandidateQueue.current.length) {
            try { await peerRef.current.addIceCandidate(new RTCIceCandidate(iceCandidateQueue.current.shift())); }
            catch (e) { console.warn("[ICE drain]", e); }
        }
    }, []);

    const buildPeer = useCallback((targetId) => {
        if (peerRef.current) peerRef.current.close();
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerRef.current = pc;
        const remote = new MediaStream();
        pc.ontrack = (e) => { e.streams[0].getTracks().forEach((t) => remote.addTrack(t)); attachRemote(remote); };
        pc.onicecandidate = (e) => { if (e.candidate) socket.emit("ice-candidate", { to: targetId, candidate: e.candidate }); };
        pc.onconnectionstatechange = () => {
            console.log("[WebRTC]", pc.connectionState);
            if (pc.connectionState === "failed") {
                toast.error("Call connection failed."); cleanup();
                dispatch(setCallStatus("idle")); dispatch(setCallData(null));
            }
        };
        return pc;
    }, [cleanup, dispatch]);

    const getMedia = (isVideo) => navigator.mediaDevices.getUserMedia(
        isVideo
            ? { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: true }
            : { video: false, audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
    );

    // ── Socket listeners
    useEffect(() => {
        const onIncoming = ({ signal, from, name, callType, image }) => {
            dispatch(setCallData({ from, name, callType, image, signal }));
            dispatch(setCallStatus("incoming"));
            isInitiatorRef.current = false;
            playRingtone();
        };
        const onAccepted = async (signal) => {
            if (!peerRef.current) return;
            clearTimeout(callerTimeoutRef.current); callerTimeoutRef.current = null;
            stopRingtone();
            try {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                remoteDescSet.current = true; await drainIceQueue();
                dispatch(setCallStatus("connected")); startTimer();
            } catch (e) { console.error("[onAccepted]", e); }
        };
        const onIce = async (candidate) => {
            if (!candidate) return;
            if (peerRef.current && remoteDescSet.current) {
                try { await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
                catch (e) { console.warn("[ICE]", e); }
            } else { iceCandidateQueue.current.push(candidate); }
        };
        const onRejected = () => { cleanup(); dispatch(setCallStatus("idle")); dispatch(setCallData(null)); toast.error("Call declined."); };
        const onEnded    = () => { cleanup(); dispatch(setCallStatus("idle")); dispatch(setCallData(null)); toast.info("Call ended."); };
        const onMissed   = () => { cleanup(); dispatch(setCallStatus("idle")); dispatch(setCallData(null)); toast.warn("Missed call."); };

        socket.on("incoming call", onIncoming); socket.on("call accepted", onAccepted);
        socket.on("ice-candidate", onIce);      socket.on("call rejected", onRejected);
        socket.on("call ended", onEnded);       socket.on("call missed", onMissed);
        return () => {
            socket.off("incoming call", onIncoming); socket.off("call accepted", onAccepted);
            socket.off("ice-candidate", onIce);      socket.off("call rejected", onRejected);
            socket.off("call ended", onEnded);       socket.off("call missed", onMissed);
        };
    }, [dispatch, cleanup, drainIceQueue]);

    // ── Outbound call
    useEffect(() => {
        if (callStatus !== "calling" || !callData || peerRef.current) return;
        isInitiatorRef.current = true;
        (async () => {
            try {
                const stream = await getMedia(callData.callType === "video");
                attachLocal(stream);
                const pc = buildPeer(callData.to);
                stream.getTracks().forEach((t) => pc.addTrack(t, stream));
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("call user", { userToCall: callData.to, signalData: offer, from: authUser._id, name: `${authUser.firstName} ${authUser.lastName}`, image: authUser.image, callType: callData.callType });
                callerTimeoutRef.current = setTimeout(() => {
                    socket.emit("missed call", { to: callData.to, callerId: authUser._id, receiverId: callData.to, type: callData.callType });
                    cleanup(); dispatch(setCallStatus("idle")); dispatch(setCallData(null)); toast.warn("No answer.");
                }, CALLER_TIMEOUT_MS);
            } catch (err) {
                console.error("Outbound:", err);
                toast.error("Camera/mic permission denied.");
                dispatch(setCallStatus("idle")); dispatch(setCallData(null));
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callStatus]);

    // ── Answer
    const answerCall = async () => {
        stopRingtone();
        try {
            const stream = await getMedia(callData.callType === "video");
            attachLocal(stream);
            const pc = buildPeer(callData.from);
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            await pc.setRemoteDescription(new RTCSessionDescription(callData.signal));
            remoteDescSet.current = true; await drainIceQueue();
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer call", { to: callData.from, signal: answer });
            dispatch(setCallStatus("connected")); startTimer();
        } catch (err) { console.error("Answer:", err); toast.error("Camera/mic permission denied."); rejectCall(); }
    };

    const rejectCall = () => {
        stopRingtone();
        socket.emit("reject call", { to: callData?.from, callerId: callData?.from, receiverId: authUser?._id, type: callData?.callType });
        cleanup(); dispatch(setCallStatus("idle")); dispatch(setCallData(null));
    };

    const endCall = () => {
        const elapsed = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
        const other = isInitiatorRef.current ? callData?.to : callData?.from;
        socket.emit("end call", { to: other, callerId: isInitiatorRef.current ? authUser._id : callData?.from, receiverId: isInitiatorRef.current ? callData?.to : authUser._id, type: callData?.callType, duration: elapsed });
        cleanup(); dispatch(setCallStatus("idle")); dispatch(setCallData(null));
    };

    const toggleMic = () => { const t = localRef.current?.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setIsMicOn(t.enabled); } };
    const toggleCam = () => { const t = localRef.current?.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setIsCamOn(t.enabled); } };
    const toggleSpeaker = () => { if (remoteVideoRef.current) { remoteVideoRef.current.muted = !remoteVideoRef.current.muted; setIsSpeakerOn(!remoteVideoRef.current.muted); } };

    if (callStatus === "idle") return null;

    const isVideo     = callData?.callType === "video";
    const isConnected = callStatus === "connected";
    const isIncoming  = callStatus === "incoming";
    const isCalling   = callStatus === "calling";

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-2xl">

            {/* ── VIDEO CONNECTED ─────────────────────────────────────── */}
            {isVideo && isConnected ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                    {/* Remote video — full screen */}
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

                    {/* Waiting overlay */}
                    {!remoteReady && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                            <img src={getValidImage(callData?.image)} alt="" className="w-28 h-28 rounded-full object-cover border-4 border-slate-700 mb-4 animate-pulse" />
                            <p className="text-white font-bold text-xl mb-1">{callData?.name}</p>
                            <p className="text-blue-400 text-xs uppercase tracking-widest animate-pulse">Connecting video…</p>
                        </div>
                    )}

                    {/* Local PiP — top right */}
                    <div className="absolute top-4 right-4 w-36 h-48 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-slate-900 z-10">
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        {!isCamOn && <div className="absolute inset-0 bg-slate-900 flex items-center justify-center"><MdVideocamOff className="text-slate-400 text-4xl" /></div>}
                    </div>

                    {/* Top info bar */}
                    <div className="absolute top-4 left-4 z-10 bg-black/60 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                        <p className="text-white font-bold text-sm">{callData?.name}</p>
                        <p className="text-green-400 text-xs font-semibold tabular-nums">{fmt(duration)}</p>
                    </div>

                    {/* Bottom controls */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
                        <div className="flex gap-3 bg-black/60 px-6 py-3 rounded-3xl backdrop-blur-md border border-white/10">
                            <Btn onClick={toggleMic}     active={isMicOn}     icon={isMicOn     ? <MdMic size={22}/>      : <MdMicOff size={22}/>} />
                            <Btn onClick={toggleCam}     active={isCamOn}     icon={isCamOn     ? <MdVideocam size={22}/> : <MdVideocamOff size={22}/>} />
                            <Btn onClick={toggleSpeaker} active={isSpeakerOn} icon={isSpeakerOn ? <MdVolumeUp size={22}/> : <MdVolumeOff size={22}/>} />
                            <button onClick={endCall} className="bg-red-500 hover:bg-red-600 p-4 rounded-full text-white transition-all active:scale-90 shadow-lg">
                                <MdCallEnd size={26} />
                            </button>
                        </div>
                    </div>
                </div>

            ) : (
                /* ── VOICE / RINGING / INCOMING ────────────────────────── */
                <div className="w-full max-w-sm mx-4">
                    <div className="relative bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-[3rem] border border-slate-700/60 shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500" />
                        {!isConnected && (
                            <>
                                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full border border-blue-500/20 animate-ping" />
                                <div className="absolute top-28 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full border border-blue-400/10 animate-ping" style={{ animationDelay: "0.4s" }} />
                            </>
                        )}
                        <div className="flex flex-col items-center px-8 pt-12 pb-10 relative z-10">
                            <div className="relative mb-6">
                                <div className={`absolute -inset-3 rounded-full ${isConnected ? "bg-green-500/15" : "bg-blue-500/15 animate-pulse"}`} />
                                <img src={getValidImage(callData?.image)} alt="" className="w-32 h-32 rounded-full object-cover border-4 border-slate-700 shadow-2xl relative z-10" />
                                <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2.5 rounded-full border-4 border-slate-900 z-20">
                                    {isVideo ? <MdVideoCall className="text-white text-lg" /> : <MdCall className="text-white text-lg" />}
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-white mb-1 tracking-tight text-center">{callData?.name}</h2>
                            <div className="flex items-center gap-2 mb-6">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-blue-400 animate-pulse"}`} />
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    {isIncoming ? "Incoming" : isCalling ? "Ringing…" : fmt(duration)} · {callData?.callType}
                                </span>
                            </div>

                            {isConnected && <div className="mb-6"><AudioWave active={isMicOn} /></div>}

                            {isConnected && (
                                <div className="flex gap-3 mb-8">
                                    <Btn onClick={toggleMic}     active={isMicOn}     icon={isMicOn     ? <MdMic size={20}/>      : <MdMicOff size={20}/>}     label={isMicOn ? "Mute" : "Unmute"} />
                                    <Btn onClick={toggleSpeaker} active={isSpeakerOn} icon={isSpeakerOn ? <MdVolumeUp size={20}/> : <MdVolumeOff size={20}/>} label={isSpeakerOn ? "Speaker" : "Muted"} />
                                </div>
                            )}

                            <div className="flex gap-10 items-center">
                                {isIncoming ? (
                                    <>
                                        <ActionBtn onClick={rejectCall} color="red"   icon={<MdCallEnd size={34}/>} label="Decline" />
                                        <ActionBtn onClick={answerCall} color="green" icon={<MdCall size={34} className="animate-bounce"/>} label="Accept" />
                                    </>
                                ) : (
                                    <ActionBtn onClick={endCall} color="red" icon={<MdCallEnd size={34}/>} label="End Call" />
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Hidden audio elements for voice call */}
                    <video ref={localVideoRef}  autoPlay playsInline muted className="hidden" />
                    <video ref={remoteVideoRef} autoPlay playsInline       className="hidden" />
                </div>
            )}
        </div>
    );
};

const Btn = ({ onClick, active, icon, label }) => (
    <button onClick={onClick} title={label}
        className={`flex flex-col items-center gap-1 p-3.5 rounded-2xl border transition-all active:scale-90 ${active ? "bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700" : "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30"}`}>
        {icon}
        {label && <span className="text-[10px] font-semibold">{label}</span>}
    </button>
);

const ActionBtn = ({ onClick, color, icon, label }) => (
    <div className="flex flex-col items-center gap-2">
        <button onClick={onClick} className={`${color === "green" ? "bg-green-500 hover:bg-green-400 shadow-green-900/50" : "bg-red-500 hover:bg-red-400 shadow-red-900/50"} p-5 rounded-full text-white shadow-2xl transition-all active:scale-90`}>
            {icon}
        </button>
        <span className="text-xs text-slate-400 font-semibold">{label}</span>
    </div>
);

export default CallModal;
