import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
} from "remotion";
import { theme } from "../theme";

interface Highlight {
  icon: string;
  title: string;
  description: string;
}

interface HighlightsSceneProps {
  title: string;
  subtitle?: string;
  highlights: Highlight[];
}

export const HighlightsScene: React.FC<HighlightsSceneProps> = ({
  title,
  subtitle,
  highlights,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        opacity,
      }}
    >
      {/* Decorative background */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          marginTop: -250,
          marginLeft: -250,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${theme.brandFromRgb},0.12) 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 100px",
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: theme.textPrimary,
            textAlign: "center",
            marginBottom: subtitle ? 8 : 48,
          }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            style={{
              fontSize: 22,
              fontWeight: 400,
                    color: theme.textMuted,
              textAlign: "center",
              marginBottom: 48,
              maxWidth: 600,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Highlight cards */}
        <div
          style={{
            display: "flex",
            gap: 32,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {highlights.map((h, i) => {
            const itemScale = spring({
              frame: frame - 10 - i * 8,
              fps: 30,
              config: { damping: 14, mass: 0.5 },
            });
            const itemOpacity = interpolate(
              frame,
              [10 + i * 8, 25 + i * 8],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  width: 280,
                  padding: "32px 24px",
                  borderRadius: 16,
                  backgroundColor: `rgba(${theme.surfaceRgb}, 0.85)`,
                  border: `1px solid rgba(${theme.borderRgb}, 0.4)`,
                  textAlign: "center",
                  opacity: itemOpacity,
                  transform: `scale(${itemScale})`,
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    marginBottom: 16,
                    lineHeight: 1,
                  }}
                >
                  {h.icon}
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: theme.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  {h.title}
                </h3>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 400,
              color: theme.textMuted,
                    lineHeight: 1.5,
                  }}
                >
                  {h.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
