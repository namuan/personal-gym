import { AbsoluteFill, Sequence } from "remotion";
import { theme } from "./theme";
import { TitleScene } from "./scenes/TitleScene";
import { FeatureScene } from "./scenes/FeatureScene";
import { HighlightsScene } from "./scenes/HighlightsScene";
import { OutroScene } from "./scenes/OutroScene";

const FPS = 30;
const SEC = FPS;

export const ProductVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* 1. Title - 4s (frames 0-120) */}
      <Sequence from={0} durationInFrames={4 * SEC}>
        <TitleScene />
      </Sequence>

      {/* 2. Plan Editor - 5s (frames 120-270) */}
      <Sequence from={4 * SEC} durationInFrames={5 * SEC}>
        <FeatureScene
          title="Design Your Workout"
          description="Create your perfect home workout plan. Add exercises, set reps and rest times, reorder, and customize every detail — all in one simple editor."
          screenshotFile="screenshots/plan-editor.png"
          align="left"
          gradientFrom={theme.featureGradients.planEditor.from}
          gradientTo={theme.featureGradients.planEditor.to}
        />
      </Sequence>

      {/* 3. Workout in Progress - 5s (frames 270-420) */}
      <Sequence from={9 * SEC} durationInFrames={5 * SEC}>
        <FeatureScene
          title="Guided Step-by-Step"
          description="Follow along as the app guides you through each set of each exercise. Mark reps completed and watch your progress bar fill up."
          screenshotFile="screenshots/session-in-progress.png"
          align="right"
          gradientFrom={theme.featureGradients.sessionProgress.from}
          gradientTo={theme.featureGradients.sessionProgress.to}
        />
      </Sequence>

      {/* 4. Rest Timer - 4s (frames 420-540) */}
      <Sequence from={14 * SEC} durationInFrames={4 * SEC}>
        <FeatureScene
          title="Smart Rest Timer"
          description="Automatic countdown between sets keeps your workout on track. Skip or adjust anytime — you're in control."
          screenshotFile="screenshots/session-rest.png"
          align="left"
          gradientFrom={theme.featureGradients.restTimer.from}
          gradientTo={theme.featureGradients.restTimer.to}
        />
      </Sequence>

      {/* 5. History - 5s (frames 540-690) */}
      <Sequence from={18 * SEC} durationInFrames={5 * SEC}>
        <FeatureScene
          title="Track Your Progress"
          description="Every completed workout is saved with full detail — date, sets, reps, and duration. Watch yourself improve over time."
          screenshotFile="screenshots/history.png"
          align="right"
          gradientFrom={theme.featureGradients.history.from}
          gradientTo={theme.featureGradients.history.to}
        />
      </Sequence>

      {/* 6. PWA Features - 4s (frames 690-810) */}
      <Sequence from={23 * SEC} durationInFrames={4 * SEC}>
        <HighlightsScene
          title="Works Everywhere"
          subtitle="A Progressive Web App — install it on any device, use it anywhere."
          highlights={[
            {
              icon: "📱",
              title: "Install on Any Device",
              description:
                "Add to your home screen on iPhone, Android, or desktop. No app store needed.",
            },
            {
              icon: "✈️",
              title: "Works Offline",
              description:
                "All data lives on your device. No internet required once loaded.",
            },
            {
              icon: "🔒",
              title: "100% Private",
              description:
                "No accounts, no tracking, no servers. Your data never leaves your device.",
            },
          ]}
        />
      </Sequence>

      {/* 7. Outro - 3s (frames 810-900) */}
      <Sequence from={27 * SEC} durationInFrames={3 * SEC}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
