import Appbar from "./componets/appbar";
import { Hero } from "./componets/hero";
import { Upload } from "./componets/upload";

export default function Home() {
  return (
    <main>
      <Appbar />
      <Hero />
      <Upload />
    </main>
  );
}
