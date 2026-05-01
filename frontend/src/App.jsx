import React, { useEffect, useState } from "react";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Error from "./pages/Error";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "./redux/store";
import ProfileDetail from "./components/ProfileDetail";
import Loading from "./components/loading/Loading";
import GroupChatBox from "./components/chatComponents/GroupChatBox";
import NotificationBox from "./components/NotificationBox";
import CallModal from "./components/CallModal";
import ErrorBoundary from "./components/ErrorBoundary";
// import GroupChatBox from "./components/GroupChatBox";

const Applayout = () => {
    const [toastPosition, setToastPosition] = useState("bottom-left");
    const isProfileDetails = useSelector(
        (store) => store.condition.isProfileDetail
    );
    const isGroupChatBox = useSelector(
        (store) => store.condition.isGroupChatBox
    );
    const isNotificationBox = useSelector(
        (store) => store.condition.isNotificationBox
    );
    const isLoading = useSelector((store) => store.condition.isLoading);
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 600) {
                setToastPosition("bottom-left");
            } else {
                setToastPosition("top-left");
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);
    return (
        <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-black">
            <ToastContainer
                position={toastPosition}
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                stacked
                limit={3}
                toastStyle={{
                    border: "1px solid #dadadaaa",
                    textTransform: "capitalize",
                }}
            />
            <Header />
            <div className="h-16 md:h-20 flex-none"></div>
            <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto p-0 sm:p-4 overflow-hidden">
                <Outlet />
                {isProfileDetails && <ProfileDetail />}
                {isGroupChatBox && <GroupChatBox />}
                {isNotificationBox && <NotificationBox />}
                <CallModal />
            </div>
            {isLoading && <Loading />}
            <Footer />
        </div>
    );
};
const routers = createBrowserRouter([
    {
        path: "/",
        element: <Applayout />,
        children: [
            {
                path: "/",
                element: <Home />,
            },
            {
                path: "/signup",
                element: <SignUp />,
            },
            {
                path: "/signin",
                element: <SignIn />,
            },
            {
                path: "/forgot-password",
                element: <ForgotPassword />,
            },
            {
                path: "/reset-password",
                element: <ResetPassword />,
            },
            {
                path: "*",
                element: <Error />,
            },
        ],
        errorElement: <Error />,
    },
]);

function App() {
    return (
        <ErrorBoundary>
            <Provider store={store}>
                <RouterProvider router={routers} />
            </Provider>
        </ErrorBoundary>
    );
}

export default App;
