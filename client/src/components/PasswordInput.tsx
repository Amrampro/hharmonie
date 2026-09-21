import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
export function PasswordInput({ style, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return <span style={{ display: "block", position: "relative", width: "100%" }}>
    <input {...props} type={visible ? "text" : "password"} style={{ ...style, paddingRight: 48 }} />
    <button type="button" aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} aria-pressed={visible} onClick={() => setVisible(!visible)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: 0, padding: 7, cursor: "pointer", color: "#745c68" }}>{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button>
  </span>;
}
