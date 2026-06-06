function RequiredLabel({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {children}
      <span className="font-semibold text-red-500">*</span>
    </span>
  );
}

export default RequiredLabel;
