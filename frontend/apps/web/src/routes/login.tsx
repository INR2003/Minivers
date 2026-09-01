import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function Login() {
  const [showSignIn, setShowSignIn] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const localUser = localStorage.getItem("minivers_user");
    if (localUser) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
