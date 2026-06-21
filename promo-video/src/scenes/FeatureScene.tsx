import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Img,
  staticFile,
  spring,
} from "remotion";

interface FeatureSceneProps {
  title: string;
  description: string;
  screenshotFile: string;
  align?: "left" | "right";
  gradientFrom?: string;
  gradientTo?: string;
}

export const FeatureScene: React.FC<FeatureSceneProps> = ({
  title,
  description,
  screenshotFile,
  align = "left",
  gradientFrom = "#6366f1",
  gradientTo = "#a78bfa",
}) => {
  const frame = useCurrentFrame();

  // Entrance animation
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 25], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  // Phone mockup entrance
  const phoneScale = spring({
    frame: frame - 5,
    fps: 30,
    config: { damping: 14, mass: 0.6 },
  });
  const phoneOpacity = interpolate(frame, [5, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isLeft = align === "left";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f172a",
        opacity,
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: "absolute",
          top: isLeft ? "5%" : "20%",
          right: isLeft ? "5%" : undefined,
          left: isLeft ? undefined : "5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${gradientFrom}15 0%, transparent 70%)`,
        }}
      />

      {/* Content layout */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 80,
          padding: "60px 80px",
          transform: `translateY(${y}px)`,
        }}
      >
        {/* Screenshot with phone mockup */}
        <div
          style={{
            order: isLeft ? 0 : 1,
            opacity: phoneOpacity,
            transform: `scale(${phoneScale})`,
            transformOrigin: "center center",
          }}
        >
          <div
            style={{
              width: 320,
              height: 730,
              borderRadius: 36,
              border: "3px solid #334155",
              overflow: "hidden",
              boxShadow: "0 20px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)",
              backgroundColor: "#1e293b",
              position: "relative",
            }}
          >
            {/* Status bar mockup */}
            <div
              style={{
                height: 36,
                backgroundColor: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 20px",
              }}
            >
              <div
                style={{
                  width: 120,
                  height: 5,
                  backgroundColor: "#334155",
                  borderRadius: 3,
                }}
              />
            </div>
            {/* Screenshot image */}
            <Img
              src={staticFile(screenshotFile)}
              style={{
                width: "100%",
                height: "calc(100% - 36px)",
                objectFit: "contain",
                objectPosition: "center center",
              }}
            />
          </div>
        </div>

        {/* Text content */}
        <div
          style={{
            order: isLeft ? 1 : 0,
            width: 480,
            opacity,
          }}
        >
          {/* Gradient accent line */}
          <div
            style={{
              width: 48,
              height: 4,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
              marginBottom: 24,
              marginLeft: isLeft ? 0 : "auto",
              marginRight: isLeft ? undefined : 0,
            }}
          />
          <h2
            style={{
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#f8fafc",
              lineHeight: 1.15,
              marginBottom: 16,
              textAlign: isLeft ? "left" : "right",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: "#94a3b8",
              lineHeight: 1.6,
              textAlign: isLeft ? "left" : "right",
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
