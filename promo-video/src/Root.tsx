import "./index.css";
import { Composition } from "remotion";
import { ProductVideo } from "./ProductVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ProductVideo"
        component={ProductVideo}
        durationInFrames={30 * 30} // 30 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
