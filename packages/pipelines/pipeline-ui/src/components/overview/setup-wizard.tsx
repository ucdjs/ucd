import { Button } from "@ucdjs-internal/shared-ui/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ucdjs-internal/shared-ui/ui/card";
import { ArrowLeft, ArrowRight, Check, Database, Folder, Github, Gitlab } from "lucide-react";
import { useState } from "react";

interface SetupWizardProps {
  onComplete?: () => void;
}

type SourceType = "local" | "github" | "gitlab" | null;

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<SourceType>(null);

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleTypeSelect = (type: SourceType) => {
    setSelectedType(type);
    handleNext();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 <= step ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Step
          {" "}
          {step}
          {" "}
          of
          {" "}
          {totalSteps}
        </p>
      </div>

      {step === 1 && <WelcomeStep onNext={handleNext} />}
      {step === 2 && <TypeSelectionStep onSelect={handleTypeSelect} />}
      {step === 3 && <InstructionsStep type={selectedType} onNext={handleNext} />}
      {step === 4 && <VerificationStep onNext={handleNext} />}
      {step === 5 && <CompleteStep onComplete={handleNext} />}
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Database className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome to Pipeline Server</CardTitle>
        <CardDescription>Let&apos;s get you set up with your first pipeline source</CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground">
        <p className="mb-4">
          Pipeline Server helps you organize, execute, and monitor your data pipelines.
        </p>
        <p>
          To get started, you&apos;ll need to add a pipeline source. This can be a local folder
          or a remote Git repository.
        </p>
      </CardContent>
      <CardFooter className="justify-center">
        <Button onClick={onNext}>
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function TypeSelectionStep({ onSelect }: { onSelect: (type: "local" | "github" | "gitlab") => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Source Type</CardTitle>
        <CardDescription>Select where your pipeline files are stored</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <button
          onClick={() => onSelect("local")}
          className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Folder className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Local Filesystem</h3>
            <p className="text-sm text-muted-foreground">
              Pipeline files stored on this server
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => onSelect("github")}
          className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-gray-900/10 flex items-center justify-center">
            <Github className="w-5 h-5 text-gray-900" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">GitHub Repository</h3>
            <p className="text-sm text-muted-foreground">Pipeline files in a GitHub repo</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => onSelect("gitlab")}
          className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Gitlab className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">GitLab Repository</h3>
            <p className="text-sm text-muted-foreground">Pipeline files in a GitLab repo</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </CardContent>
    </Card>
  );
}

function InstructionsStep({
  type,
  onNext,
}: {
  type: "local" | "github" | "gitlab" | null;
  onNext: () => void;
}) {
  const getInstructions = () => {
    switch (type) {
      case "local":
        return {
          title: "Configure Local Filesystem Source",
          description: "Add your local folder to the configuration",
          steps: [
            "Open your config.yaml file",
            "Add a source entry with type: 'local'",
            "Specify the path to your pipelines folder",
            "Save the file and restart the server",
          ],
          example: `sources:
  - id: my-pipelines
    type: local
    path: /path/to/pipelines`,
        };
      case "github":
        return {
          title: "Configure GitHub Repository",
          description: "Connect a GitHub repository containing your pipelines",
          steps: [
            "Open your config.yaml file",
            "Add a source entry with type: 'github'",
            "Specify the repository URL",
            "Optionally specify a branch (defaults to main)",
            "Save the file and restart the server",
          ],
          example: `sources:
  - id: github-pipelines
    type: github
    url: https://github.com/username/repo
    branch: main`,
        };
      case "gitlab":
        return {
          title: "Configure GitLab Repository",
          description: "Connect a GitLab repository containing your pipelines",
          steps: [
            "Open your config.yaml file",
            "Add a source entry with type: 'gitlab'",
            "Specify the repository URL",
            "Optionally specify a branch (defaults to main)",
            "Save the file and restart the server",
          ],
          example: `sources:
  - id: gitlab-pipelines
    type: gitlab
    url: https://gitlab.com/username/repo
    branch: main`,
        };
      default:
        return {
          title: "Configure Source",
          description: "Add your source to the configuration",
          steps: ["Please go back and select a source type"],
          example: "",
        };
    }
  };

  const instructions = getInstructions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{instructions.title}</CardTitle>
        <CardDescription>{instructions.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {instructions.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">{i + 1}</span>
              </div>
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>

        {instructions.example && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Example configuration:</p>
            <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto">
              {instructions.example}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function VerificationStep({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Your Setup</CardTitle>
        <CardDescription>Make sure everything is working correctly</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Check Configuration</p>
            <p className="text-sm text-muted-foreground">
              Verify your config.yaml syntax is correct
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Restart Server</p>
            <p className="text-sm text-muted-foreground">
              The server needs to restart to load new sources
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Check Sidebar</p>
            <p className="text-sm text-muted-foreground">
              Your sources should appear in the left sidebar
            </p>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg mt-4">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong>
            {" "}
            If you don&apos;t see your sources after restarting, check the
            server logs for any configuration errors.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function CompleteStep({ onComplete }: { onComplete: () => void }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-500" />
        </div>
        <CardTitle className="text-2xl">You&apos;re All Set!</CardTitle>
        <CardDescription>Your pipeline server is configured and ready</CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground space-y-4">
        <p>
          Once you&apos;ve added your sources and restarted the server, you&apos;ll see them in
          the sidebar.
        </p>
        <p>From there you can:</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Browse pipeline files</li>
          <li>View pipeline details</li>
          <li>Execute pipelines</li>
          <li>Monitor executions</li>
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button onClick={onComplete} className="w-full">
          Go to Dashboard
        </Button>
        <Button variant="outline" className="w-full">
          <a
            href="https://docs.ucdjs.dev/pipelines"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            View Documentation
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
