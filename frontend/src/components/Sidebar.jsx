import { MdChat, MdGroups, MdCall, MdVideoCall, MdPerson, MdNotificationsActive } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOutOutline } from "react-icons/io5";
import { setProfileDetail, setNotificationBox } from "../redux/slices/conditionSlice";
import { getValidImage } from "../utils/getChatName";

const Sidebar = ({ activeSection, setActiveSection }) => {
    const authUser = useSelector((store) => store?.auth);
    const newMessageRecieved = useSelector(
        (store) => store?.myChat?.newMessageRecieved
    );
    const dispatch = useDispatch();

    const navItems = [
        { id: "chat", icon: <MdChat fontSize={24} />, label: "Chats" },
        { id: "groups", icon: <MdGroups fontSize={24} />, label: "Groups" },
        { id: "contacts", icon: <MdPerson fontSize={24} />, label: "Contacts" },
        { id: "calls", icon: <MdCall fontSize={24} />, label: "Calls" },
        { id: "video", icon: <MdVideoCall fontSize={24} />, label: "Video" },
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };

    return (
        <div className="w-16 sm:w-20 h-full flex flex-col items-center py-6 bg-slate-900/80 backdrop-blur-md border-r border-slate-700/50 transition-all duration-300">
            <div className="flex flex-col gap-6 flex-1 w-full items-center">
                {navItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`relative group cursor-pointer p-3 rounded-xl transition-all duration-300 ${
                            activeSection === item.id
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                        title={item.label}
                    >
                        {item.icon}
                        {activeSection === item.id && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
                        )}
                        <span className="absolute left-20 bg-slate-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none sm:block hidden">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
            
            <div className="flex flex-col gap-4 items-center mb-2">
                <div
                    className={`relative cursor-pointer p-3 text-slate-400 hover:text-blue-400 rounded-xl transition-all active:scale-90 ${
                        newMessageRecieved.length > 0 ? "animate-bounce" : ""
                    }`}
                    onClick={() => dispatch(setNotificationBox(true))}
                    title={`You have ${newMessageRecieved.length} notifications`}
                >
                    <MdNotificationsActive fontSize={24} />
                    {newMessageRecieved.length > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full border border-slate-900">
                            {newMessageRecieved.length}
                        </span>
                    )}
                </div>

                <div 
                    onClick={() => dispatch(setProfileDetail())}
                    className="cursor-pointer p-0.5 rounded-full border-2 border-slate-700 hover:border-blue-500 transition-all duration-300 active:scale-90"
                >
                    <img
                        src={getValidImage(authUser?.image)}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                        title="View Profile"
                    />
                </div>
                
                <div 
                    onClick={handleLogout}
                    className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl cursor-pointer transition-all active:scale-90"
                    title="Logout"
                >
                    <IoLogOutOutline fontSize={24} />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
