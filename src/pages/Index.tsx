import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full bg-accent/60 blur-3xl" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] rounded-full bg-lavender/40 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 glass-strong rounded-2xl px-10 py-14 max-w-md w-full text-center flex flex-col items-center gap-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-display text-foreground">
            English Teacher LMS
          </h1>
          <p className="text-muted-foreground text-base">
            Your elegant space for learning materials, quizzes, and student progress.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full mt-2">
          <Button asChild className="h-14 text-lg rounded-xl" size="lg">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="h-14 text-lg rounded-xl" size="lg">
            <Link to="/register">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
