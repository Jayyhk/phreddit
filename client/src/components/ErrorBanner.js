import React from "react";

const ErrorBanner = ({ error, onError }) => {
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
      <button
        className="button_style button_hover"
        onClick={() => {
          onError();
        }}
        style={{ color: "black" }}
      >
        Return to Welcome Page
      </button>
    </div>
  );
};

export default ErrorBanner;
