"use client";
import { useEffect, useState } from "react";

export default function IOSInstallNotice() {
  const [isIOS, setIsIOS] = useState(false);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(iOS);
    if (iOS && !window.matchMedia("(display-mode: standalone)").matches) {
      // small delay so it doesn't flash immediately on load
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setTimeout(() => setShow(false), 400);
  };

  if (!show || !isIOS) return null;

  return (
    <>
      <style>{`
        @keyframes rise {
          0%   { transform: translateY(110%); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes sink {
          0%   { transform: translateY(0);    opacity: 1; }
          100% { transform: translateY(110%); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.6; }
          70%  { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(0.9); opacity: 0; }
        }
        .ios-notice {
          animation: rise 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .ios-notice.leaving {
          animation: sink 0.4s ease-in forwards;
        }
        .ios-icon-float {
          animation: float 3s ease-in-out infinite;
        }
        .share-arrow {
          animation: float 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* backdrop blur pill */}
      <div
        className={`ios-notice ${dismissed ? "leaving" : ""} fixed bottom-5 left-1/2 -translate-x-1/2 z-[999] w-[92%] max-w-sm`}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: "24px",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(174,33,8,0.08)",
            overflow: "hidden",
          }}
        >
          {/* red accent bar */}
          <div
            style={{
              height: "3px",
              background: "linear-gradient(90deg, #AE2108 0%, #e85d3a 100%)",
            }}
          />

          <div className="px-5 py-4">
            {/* header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                {/* app icon placeholder */}
                <div
                  className="ios-icon-float relative"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background:
                      "linear-gradient(135deg, #AE2108 0%, #c73a1e 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(174,33,8,0.35)",
                    flexShrink: 0,
                  }}
                >
                  {/* pulse ring */}
                  <div
                    style={{
                      position: "absolute",
                      inset: -4,
                      borderRadius: 16,
                      border: "2px solid rgba(174,33,8,0.4)",
                      animation: "pulse-ring 2s ease-out infinite",
                    }}
                  />
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                      fill="white"
                      opacity="0"
                    />
                    <text
                      x="4"
                      y="17"
                      fontSize="14"
                      fontWeight="800"
                      fill="white"
                      fontFamily="system-ui"
                    >
                      C
                    </text>
                  </svg>
                  <span
                    style={{
                      color: "white",
                      fontWeight: 800,
                      fontSize: 15,
                      letterSpacing: -0.5,
                    }}
                  >
                    C
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#111",
                      lineHeight: 1.2,
                    }}
                  >
                    Add to Home Screen
                  </p>
                  <p style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                    ChowSpace
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.06)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1 1l8 8M9 1L1 9"
                    stroke="#666"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* instruction steps */}
            <div
              style={{
                background: "rgba(0,0,0,0.03)",
                borderRadius: 14,
                padding: "10px 12px",
                marginBottom: 12,
              }}
            >
              {/* step 1 */}
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "rgba(174,33,8,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {/* Safari share icon */}
                  <svg
                    className="share-arrow"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M12 2v13M7 7l5-5 5 5"
                      stroke="#AE2108"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 14v5a1 1 0 001 1h14a1 1 0 001-1v-5"
                      stroke="#AE2108"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p style={{ fontSize: 12, color: "#333", lineHeight: 1.4 }}>
                  Tap the{" "}
                  <span style={{ fontWeight: 700, color: "#AE2108" }}>
                    Share
                  </span>{" "}
                  button at the bottom of Safari
                </p>
              </div>

              {/* divider */}
              <div
                style={{
                  height: 1,
                  background: "rgba(0,0,0,0.05)",
                  margin: "0 0 8px 0",
                }}
              />

              {/* step 2 */}
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: "rgba(174,33,8,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="4"
                      stroke="#AE2108"
                      strokeWidth="2.2"
                    />
                    <path
                      d="M12 8v8M8 12h8"
                      stroke="#AE2108"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p style={{ fontSize: 12, color: "#333", lineHeight: 1.4 }}>
                  Select{" "}
                  <span style={{ fontWeight: 700, color: "#AE2108" }}>
                    Add to Home Screen
                  </span>
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleDismiss}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 12,
                background: "linear-gradient(135deg, #AE2108 0%, #c73a1e 100%)",
                color: "white",
                fontWeight: 700,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                letterSpacing: 0.2,
                boxShadow: "0 4px 14px rgba(174,33,8,0.3)",
              }}
            >
              Got it!
            </button>
          </div>

          {/* bottom arrow indicator pointing down toward Safari bar */}
          <div
            style={{
              textAlign: "center",
              paddingBottom: 8,
              paddingTop: 0,
              fontSize: 10,
              color: "#bbb",
              letterSpacing: 0.3,
            }}
          >
            ↓ Share button is in the Safari toolbar
          </div>
        </div>
      </div>
    </>
  );
}
