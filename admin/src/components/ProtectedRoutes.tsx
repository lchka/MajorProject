import { Navigate } from "react-router-dom";
//protected route component that checks if the user is authenticated by looking for a token in local storage, and redirects to the login page if not
export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}