import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";
import { authModalState } from "../atoms/authModalAtom";
import { useAuthContext } from "../context/AuthContext";

const useAuth = () => {
  const { user, loading } = useAuthContext();
  const [error, setError] = useState("");
  const setAuthModalState = useSetRecoilState(authModalState);

  useEffect(() => {
    if (!user && !loading) {
      setAuthModalState({
        open: true,
        view: "login",
      });
    }
  }, [user, loading, setAuthModalState]);

  return {
    user,
    loadingUser: loading,
    error,
    setError,
  };
};

export default useAuth;
