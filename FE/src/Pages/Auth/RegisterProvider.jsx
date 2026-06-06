import Register from "./Register.jsx";

export default function RegisterProvider() {
  return (
    <Register
      initialRole="provider"
      lockRole
      useCurrentUserCredentials
    />
  );
}
