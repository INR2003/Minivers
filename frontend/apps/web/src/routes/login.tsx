import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";

export default function Login() {
  const [showSignIn, setShowSignIn] = useState(true);
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    const localUser = localStorage.getItem("minivers_user");
    if ((session || localUser) && !isPending) {
      navigate("/dashboard");
    }
  }, [session, isPending, navigate]);

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
