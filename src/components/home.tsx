import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="w-screen h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-gray-900">
          AI Portrait Auto-Cropping Tool
        </h1>
        <p className="text-xl text-gray-600 max-w-md">
          Upload your photos and let AI automatically detect and crop portraits
          with manual adjustment capabilities.
        </p>
        <Link to="/image-processor">
          <Button size="lg" className="mt-8">
            Start Processing Images
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default Home;
