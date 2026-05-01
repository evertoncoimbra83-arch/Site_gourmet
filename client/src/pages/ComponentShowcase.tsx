import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Moon,
  Sun,
} from "lucide-react";
import { appToast as sonnerToast } from "@/lib/app-toast"; // ✅ Corrigido para a lib oficial 'sonner'
import { AIChatBox, type Message } from "@/components/AIChatBox";

export default function ComponentsShowcase() {
  const { theme, toggleTheme } = useTheme();
  const [dialogInput, setDialogInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // AI ChatBox demo state
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleDialogSubmit = () => {
    sonnerToast.success("Submitted successfully", {
      description: `Input: ${dialogInput}`,
    });
    setDialogInput("");
    setDialogOpen(false);
  };

  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleDialogSubmit();
    }
  };

  const handleChatSend = (content: string) => {
    const newMessages: Message[] = [...chatMessages, { role: "user", content }];
    setChatMessages(newMessages);

    setIsChatLoading(true);
    setTimeout(() => {
      const aiResponse: Message = {
        role: "assistant",
        content: `This is a **demo response**. In a real app, you would call a tRPC mutation here.`,
      };
      setChatMessages([...newMessages, aiResponse]);
      setIsChatLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container max-w-6xl mx-auto py-10">
        <div className="space-y-2 justify-between flex items-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Shadcn/ui Component Library
          </h2>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>

        <div className="space-y-12">
          {/* Seção de Badges */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">Status & Badges</h3>
            <Card>
              <CardContent className="pt-6 flex gap-2">
                <Badge>Default</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none text-white">Success</Badge>
              </CardContent>
            </Card>
          </section>

          {/* Seção de Botões */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">Buttons</h3>
            <Card>
              <CardContent className="pt-6 flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </CardContent>
            </Card>
          </section>

          {/* Seção de Formulários */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">Form Inputs</h3>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-demo">Email</Label>
                  <Input id="email-demo" type="email" placeholder="Email" />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms-demo" />
                  <Label htmlFor="terms-demo">Accept terms and conditions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="switch-demo" />
                  <Label htmlFor="switch-demo">Airplane Mode</Label>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Seção Overlays */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">Overlays</h3>
            <Card>
              <CardContent className="pt-6 flex flex-wrap gap-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Test Input</DialogTitle>
                      <DialogDescription>Press Enter to submit.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        placeholder="Type something..."
                        value={dialogInput}
                        onChange={(e) => setDialogInput(e.target.value)}
                        onKeyDown={handleDialogKeyDown}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleDialogSubmit}>Submit</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Open Sheet</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Edit profile</SheetTitle>
                      <SheetDescription>Make changes to your profile here.</SheetDescription>
                    </SheetHeader>
                  </SheetContent>
                </Sheet>
              </CardContent>
            </Card>
          </section>

          {/* AI ChatBox */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">AI ChatBox</h3>
            <Card>
              <CardContent className="pt-6">
                <AIChatBox
                  messages={chatMessages}
                  onSendMessage={handleChatSend}
                  isLoading={isChatLoading}
                  placeholder="Try sending a message..."
                  height="400px"
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}