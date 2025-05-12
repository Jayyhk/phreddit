import React from "react";

const ReputationErrorBanner = ({ error }) => {
  if (!error) return null;

  return (
    <div
      className="banner-error"
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "fit-content",
        maxWidth: "80%",
      }}
    >
      {error}
    </div>
  );
};

export default ReputationErrorBanner;
