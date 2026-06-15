import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, Zap, Layers, Workflow, ShieldCheck, Download, Chromium as Chrome, Play, ArrowRight, Check, Cpu, Bot, Clock, Image as ImageIcon, Video, Coins, Activity } from "lucide-react";

export const CHROME_STORE_URL = "https://chromewebstore.google.com/"; // TODO: replace with real listing URL
export const EDGE_STORE_URL = "https://microsoftedge.microsoft.com/addons/"; // TODO: replace with real listing URL

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Auto Seedance — Bulk Seedance AI & Dreamina Video Automation" },
      { name: "description", content: "Automate Seedance AI and Dreamina in bulk from your browser. Queue hundreds of prompts, generate cinematic AI videos hands-free. Free Chrome extension." },
      { name: "keywords", content: "Seedance AI automation, bulk AI video generator, Dreamina automation, Seedance chrome extension, AI video workflow automation, cinematic AI video generation, browser AI productivity tool, bulk AI image generator" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "google-site-verification", content: "MktAdEwJLh_fCrckaz6WQtpgSdQ1NIw2ZzBrPDD6cKo" },
      { property: "og:title", content: "Auto Seedance — Bulk Seedance AI & Dreamina Video Automation" },
      { property: "og:description", content: "Automate Seedance AI and Dreamina in bulk from your browser. Queue hundreds of prompts, generate cinematic AI videos hands-free." },
      { property: "og:url", content: "https://autoseedance.site/" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://autoseedance.site/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Auto Seedance — Bulk Seedance AI Video Automation" },
      { name: "twitter:description", content: "Automate Seedance AI and Dreamina bulk video generation from your browser. Free Chrome extension." },
      { name: "twitter:image", content: "https://autoseedance.site/og-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://autoseedance.site/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Auto Seedance",
          applicationCategory: "BrowserApplication",
          operatingSystem: "Chrome",
          description: "Auto Seedance automates bulk AI image and video generation with Seedance AI and Dreamina workflows — a browser productivity extension for cinematic AI video generation.",
          url: "https://autoseedance.site/",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          featureList: [
            "Bulk AI video generation",
            "Seedance AI automation",
            "Dreamina workflow automation",
            "Queue hundreds of prompts",
            "Auto-download generated videos",
            "Cinematic AI video creation",
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "What is Auto Seedance?", acceptedAnswer: { "@type": "Answer", text: "Auto Seedance is a Chrome browser extension that automates bulk AI video and image generation using Seedance AI and Dreamina. It queues your prompts and runs the generation process hands-free." } },
            { "@type": "Question", name: "How does Seedance AI automation work?", acceptedAnswer: { "@type": "Answer", text: "You paste your prompts into Auto Seedance, click start, and the extension handles all inputs, generation, and downloads automatically inside your browser — no manual clicking required." } },
            { "@type": "Question", name: "Does Auto Seedance work with Dreamina?", acceptedAnswer: { "@type": "Answer", text: "Yes. Auto Seedance supports both Seedance AI and Dreamina workflows, allowing bulk generation and automation for both platforms from a single Chrome extension." } },
            { "@type": "Question", name: "Is Auto Seedance free to use?", acceptedAnswer: { "@type": "Answer", text: "Yes, Auto Seedance is free to install and use. You can begin automating your Seedance AI workflows immediately after installing the Chrome extension." } },
            { "@type": "Question", name: "Who is Auto Seedance for?", acceptedAnswer: { "@type": "Answer", text: "Auto Seedance is built for content creators, stock video contributors, marketing agencies, and AI power users who need to generate large volumes of AI videos using Seedance AI and Dreamina." } },
          ],
        }),
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Features />
      <StatsSection />
      <AIToolsSection />
      <DemoSection />
      <ExtensionSection />
      <PricingTeaser />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function IntroBlock() {
  return (
    <section className="py-12 border-y border-border bg-muted/20">
      <div className="mx-auto max-w-4xl px-4">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Auto Seedance</strong> is a browser productivity extension that automates bulk AI video and image generation using <strong className="text-foreground">Seedance AI</strong> and <strong className="text-foreground">Dreamina</strong>. Instead of manually entering one prompt at a time, you can queue hundreds of text prompts, let the extension run Seedance AI or Dreamina automatically, and have all generated videos downloaded to your device — completely hands-free. Built for content creators, marketing agencies, and stock video contributors who need to generate AI videos at scale.
        </p>
      </div>
    </section>
  );
}

function SeoHowTo() {
  const steps = [
    "Install the Auto Seedance Chrome extension — free, no account needed.",
    "Open Seedance AI or Dreamina in your browser, then paste your list of prompts into the Auto Seedance panel.",
    "Click Start. The extension automatically submits each prompt, waits for generation, and downloads every finished video to your device.",
  ];
  return (
    <section className="py-20 border-t border-border">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="font-display text-3xl md:text-4xl font-bold">How to automate Seedance AI bulk video generation</h2>
        <ol className="mt-8 space-y-5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="shrink-0 size-9 rounded-full btn-gradient grid place-items-center text-white font-bold">{i + 1}</span>
              <p className="text-muted-foreground leading-relaxed pt-1">{s}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function SeoFeatures() {
  const items = [
    { h: "Bulk prompt queuing", p: "Queue hundreds of Seedance AI prompts at once instead of entering them one by one. Dramatically reduces the time needed for large video production runs." },
    { h: "Dreamina bulk automation", p: "Auto Seedance also automates Dreamina workflows, making it the only browser extension that handles bulk generation for both Seedance AI and Dreamina from one place." },
    { h: "Auto-download generated videos", p: "Every video generated through Seedance AI or Dreamina is automatically saved to your local device. No manual downloading, no missed files." },
    { h: "Cinematic AI video generation at scale", p: "Leverage Seedance AI's 1080p multi-shot cinematics and Dreamina's image generation for large content libraries without manual effort." },
    { h: "Works inside your browser", p: "No external app, no API key, no server. Auto Seedance runs as a lightweight Chrome extension directly inside your Seedance AI and Dreamina browser sessions." },
    { h: "Set-and-forget workflow automation", p: "Start a generation queue and walk away. Auto Seedance runs the entire Seedance AI or Dreamina workflow while you focus on other work." },
  ];
  return (
    <section className="py-20 border-t border-border bg-muted/10">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl md:text-4xl font-bold">Why creators use Auto Seedance for Seedance AI automation</h2>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((f) => (
            <Card key={f.h} className="glass border-0 p-6">
              <h3 className="font-display font-semibold text-lg">{f.h}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.p}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeoAudience() {
  const paras = [
    "Content creators who publish on TikTok, YouTube Shorts, and Instagram Reels use Auto Seedance to generate a full week of video content overnight using Seedance AI bulk automation.",
    "Stock video contributors use Auto Seedance to build large AI video libraries. By queuing hundreds of Seedance AI prompts at once, they generate and download entire batches automatically.",
    "Marketing agencies use Auto Seedance to produce multiple Seedance AI video variations for client campaigns at scale, cutting production time from hours to minutes.",
  ];
  return (
    <section className="py-20 border-t border-border">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="font-display text-3xl md:text-4xl font-bold">Who uses Auto Seedance for bulk AI video generation</h2>
        <div className="mt-8 space-y-5">
          {paras.map((p, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonTable() {
  const rows = [
    ["Generate 100 Seedance AI videos", "3–4 hours of manual clicking", "Runs automatically"],
    ["Prompt queuing", "One at a time", "Hundreds at once"],
    ["Auto-download videos", "Download each manually", "Auto-saved to device"],
    ["Works while you sleep", "Requires you to be present", "Set-and-forget"],
    ["Dreamina support", "Manual only", "Fully automated"],
    ["Cost", "Your time", "Free"],
  ];
  return (
    <section className="py-20 border-t border-border bg-muted/10">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="font-display text-3xl md:text-4xl font-bold">Auto Seedance vs manual Seedance AI workflow</h2>
        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left p-4 font-semibold">Feature</th>
                <th className="text-left p-4 font-semibold">Manual workflow</th>
                <th className="text-left p-4 font-semibold">Auto Seedance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-4 font-medium">{r[0]}</td>
                  <td className="p-4 text-muted-foreground">{r[1]}</td>
                  <td className="p-4 text-primary">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative pt-40 pb-28 grid-bg overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Badge variant="outline" className="border-border bg-muted/50 backdrop-blur text-xs">
            <Sparkles className="size-3 mr-1 text-primary" /> AI Image &amp; Video Generation
          </Badge>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-6 font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]"
        >
          Create Stunning AI Images
          <br />
          <span className="gradient-text">&amp; Videos</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Professional AI generation tools powered by advanced models. Generate, download, and share — no limits on creativity.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-9 flex flex-wrap justify-center gap-3"
        >
          <Link to="/auth">
            <Button size="lg" className="btn-gradient text-white border-0 h-12 px-6 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition">
              Start Free
            </Button>
          </Link>
          <Link to="/pricing">
            <Button size="lg" variant="outline" className="h-12 px-6 border-border bg-muted/50 backdrop-blur hover:bg-muted transition">
              View Pricing <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
        </motion.div>
        <p className="mt-4 text-xs text-muted-foreground">Supports Chrome, Edge, Brave, Arc, and Opera.</p>
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 mx-auto max-w-5xl"
        >
          <div className="glass rounded-2xl p-2 glow-purple">
            <div className="rounded-xl bg-[oklch(0.13_0.03_270)] aspect-[16/9] grid place-items-center relative overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-60" />
              <div className="relative text-center">
                <div className="size-16 rounded-full btn-gradient grid place-items-center mx-auto glow-purple">
                  <Play className="size-7 text-white ml-1" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Bulk automation, running in your browser</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LogosStrip() {
  const items = ["Dreamina", "Chrome", "Edge", "Brave", "Arc", "Opera"];
  return (
    <div className="border-y border-border py-8">
      <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-muted-foreground/80">
        <span className="text-xs uppercase tracking-widest">Works with</span>
        {items.map((i) => (
          <span key={i} className="font-display font-semibold text-base opacity-70">{i}</span>
        ))}
      </div>
    </div>
  );
}

function DemoSection() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Badge variant="outline" className="border-border bg-muted/50">Automation</Badge>
          <h2 className="mt-4 font-display text-4xl font-bold">Your prompts → our queue → real results.</h2>
          <p className="mt-4 text-muted-foreground">
            Drop a list of prompts, hit run. Our browser extension takes over, drives Dreamina with your account, and streams finished images and videos back to your dashboard.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Bulk paste hundreds of prompts at once",
              "Smart retries, throttling, anti-rate-limit",
              "Auto-download &amp; organized library",
              "Realtime queue progress in your dashboard",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 size-5 rounded-md btn-gradient grid place-items-center">
                  <Check className="size-3 text-white" />
                </span>
                <span dangerouslySetInnerHTML={{ __html: t }} />
              </li>
            ))}
          </ul>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
        >
          <Card className="glass border-0 p-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Queue · 124 jobs</span>
              <span className="text-green-400">● Running</span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { p: "Cinematic drone shot of Tokyo at dusk, neon", s: 100 },
                { p: "Macro shot of glowing crystal forming, slow", s: 72 },
                { p: "Astronaut floating through neon nebula 4k", s: 41 },
                { p: "Liquid metal morphing into a rose, studio", s: 0 },
              ].map((j, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="text-xs truncate">{j.p}</div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                    <div className="h-full btn-gradient" style={{ width: `${j.s}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "2K-4K", label: "Resolution" },
    { value: "15s", label: "Max Video" },
    { value: "50+", label: "AI Models" },
    { value: "99.9%", label: "Uptime" },
  ];

  return (
    <section className="py-16 border-t border-border bg-muted/10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold gradient-text">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIToolsSection() {
  const tools = [
    {
      icon: ImageIcon,
      title: "Image Generation",
      desc: "Create stunning AI images from text prompts. Choose from realistic, digital illustration, vector, or icon styles.",
      credits: 5,
      href: "/tools/image",
      features: ["1024×1024 to 4K resolution", "4 style presets", "Realistic or stylized output"],
    },
    {
      icon: Video,
      title: "Video Generation",
      desc: "Generate cinematic AI videos with text prompts. 720p and 1080p resolution with optional audio.",
      credits: 30,
      href: "/tools/video",
      features: ["7-second clips", "Multiple aspect ratios", "AI-generated audio"],
    },
  ];

  return (
    <section id="ai-tools" className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="border-border bg-muted/50">AI Tools</Badge>
          <h2 className="mt-4 font-display text-4xl font-bold">Generate with credits, not subscriptions</h2>
          <p className="mt-3 text-muted-foreground">
            Use credits across all AI tools. Start with 50 free credits, no credit card required.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link to={tool.href}>
                <Card className="glass border-0 p-6 h-full hover:translate-y-[-2px] hover:shadow-lg hover:shadow-purple-500/10 transition group cursor-pointer glow-purple">
                  <div className="flex items-start justify-between">
                    <div className="size-12 rounded-xl btn-gradient grid place-items-center">
                      <tool.icon className="size-6 text-white" />
                    </div>
                    <Badge className="btn-gradient text-white border-0 flex items-center gap-1">
                      <Coins className="size-3" /> {tool.credits} credits
                    </Badge>
                  </div>

                  <h3 className="mt-4 font-display font-semibold text-xl">{tool.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{tool.desc}</p>

                  <ul className="mt-4 space-y-2">
                    {tool.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="size-4 text-primary shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex items-center text-primary text-sm font-medium group-hover:gap-3 transition-all">
                    <span>Try it now</span>
                    <ArrowRight className="size-4 ml-1 group-hover:translate-x-1 transition" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Credit costs: <span className="font-medium text-foreground">Text 1</span> · <span className="font-medium text-foreground">Image 5</span> · <span className="font-medium text-foreground">Animation 20</span> · <span className="font-medium text-foreground">Video 30</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: ImageIcon, title: "AI Image Generation", desc: "Generate stunning 2K/4K images from text prompts using Seedream AI" },
    { icon: Video, title: "AI Video Generation", desc: "Create cinematic videos up to 15 seconds with audio using MiniMax" },
    { icon: Chrome, title: "Bulk Extension", desc: "Automate bulk generation directly in your browser with our Chrome extension" },
  ];
  return (
    <section id="features" className="py-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="border-border bg-muted/50">Features</Badge>
          <h2 className="mt-4 font-display text-4xl font-bold">Powerful AI generation at your fingertips</h2>
          <p className="mt-3 text-muted-foreground">Create professional images and videos with cutting-edge AI models.</p>
        </div>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {items.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="glass border-0 p-6 h-full hover:translate-y-[-2px] hover:shadow-lg hover:shadow-purple-500/10 transition">
                <div className="size-10 rounded-xl btn-gradient grid place-items-center">
                  <f.icon className="size-5 text-white" />
                </div>
                <h3 className="mt-4 font-display font-semibold text-lg">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Install the extension", d: "One-click install for Chrome and Microsoft Edge." },
    { n: "02", t: "Sign in to Dreamina", d: "Use your existing Dreamina account normally." },
    { n: "03", t: "Open Auto Seedance", d: "Connect your workflow dashboard instantly." },
    { n: "04", t: "Run your queue", d: "Queue prompts and automate generation workflows." },
  ];
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="border-border bg-muted/50">How it works</Badge>
          <h2 className="mt-4 font-display text-4xl font-bold">From prompt to library in 4 steps.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-4 gap-5">
          {steps.map((s) => (
            <Card key={s.n} className="glass border-0 p-6">
              <div className="text-xs gradient-text font-display font-bold">{s.n}</div>
              <div className="mt-2 font-semibold">{s.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExtensionSection() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <Badge variant="outline" className="border-border bg-muted/50"><Chrome className="size-3 mr-1" /> Browser extension</Badge>
          <h2 className="mt-4 font-display text-4xl font-bold">Available for Chrome and Microsoft Edge.</h2>
          <p className="mt-3 text-muted-foreground">Install in one click and start automating bulk AI generation today.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <Card className="glass border-0 p-6">
            <div className="flex items-center gap-3">
              <Chrome className="size-7 text-blue-400" />
              <div>
                <div className="font-display font-semibold">Chrome Web Store</div>
                <div className="text-xs text-muted-foreground">Chrome · Brave · Arc · Opera</div>
              </div>
            </div>
            <Link to="/extension" className="block mt-5">
              <Button className="w-full btn-gradient text-white border-0">
                <Download className="size-4 mr-2" /> Install for Chrome
              </Button>
            </Link>
          </Card>
          <Card className="glass border-0 p-6">
            <div className="flex items-center gap-3">
              <Chrome className="size-7 text-cyan-400" />
              <div>
                <div className="font-display font-semibold">Microsoft Edge Add-ons</div>
                <div className="text-xs text-muted-foreground">Microsoft Edge</div>
              </div>
            </div>
            <Link to="/extension" className="block mt-5">
              <Button className="w-full btn-gradient text-white border-0">
                <Download className="size-4 mr-2" /> Install for Microsoft Edge
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}


function PricingTeaser() {
  const features = [
    "Unlimited local workflow automation",
    "Bulk prompt queueing",
    "Browser-based automation",
    "AI creator productivity tools",
  ];
  return (
    <section id="pricing" className="py-24 border-t border-border">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <Badge variant="outline" className="border-border bg-muted/50">Pricing</Badge>
        <h2 className="mt-4 font-display text-4xl font-bold">Currently Free During Early Access</h2>
        <p className="mt-3 text-muted-foreground">No credit card. No paid tiers. Just install and automate.</p>
        <Card className="glass border-0 p-8 mt-10 glow-purple text-left">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-display font-semibold text-xl">Auto Seedance — Free</h3>
              <p className="text-sm text-muted-foreground mt-1">Everything you need to automate bulk AI generation.</p>
            </div>
            <Badge className="btn-gradient text-white border-0">Early Access</Badge>
          </div>
          <ul className="mt-6 grid sm:grid-cols-2 gap-2 text-sm">
            {features.map((f) => (
              <li key={f} className="flex gap-2"><Check className="size-4 text-primary shrink-0 mt-0.5" />{f}</li>
            ))}
          </ul>
          <Link to="/extension" className="block mt-7">
            <Button size="lg" className="w-full btn-gradient text-white border-0">
              Start Free <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </section>
  );
}

// Kept for backwards-compat with /pricing route legacy import.
export const plans: Array<{
  name: string; price: string; suffix: string; badge: string | null; featured: boolean; features: string[]; cta: string;
}> = [];

function FAQ() {
  const faqs = [
    { q: "What is Auto Seedance?", a: "Auto Seedance is a Chrome extension that automates bulk AI video and image generation using Seedance AI and Dreamina. It replaces manual prompt-by-prompt entry with a fully automated queue system that runs inside your browser." },
    { q: "Does Auto Seedance work with Seedance AI?", a: "Yes. Auto Seedance is built specifically for Seedance AI workflows. It automates the entire process of submitting prompts to Seedance AI, waiting for video generation to complete, and downloading the finished cinematic AI videos to your device." },
    { q: "Does Auto Seedance support Dreamina automation?", a: "Yes. Auto Seedance supports both Seedance AI and Dreamina platforms. You can run bulk image generation through Dreamina and bulk video generation through Seedance AI using the same extension." },
    { q: "Is Auto Seedance free?", a: "Yes, Auto Seedance is completely free to install from the Chrome Web Store. You can start automating your Seedance AI and Dreamina workflows immediately after installation with no account or payment required." },
    { q: "How many prompts can I queue at once?", a: "Auto Seedance lets you queue hundreds of prompts at once. Simply paste your full prompt list into the extension panel or upload a text file, and Auto Seedance will process each one through Seedance AI or Dreamina automatically." },
  ];
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center">
          <Badge variant="outline" className="border-border bg-muted/50">FAQ</Badge>
          <h2 className="mt-4 font-display text-4xl font-bold">Questions, answered.</h2>
        </div>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-border">
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="glass rounded-3xl p-12 text-center grid-bg">
          <Layers className="size-10 mx-auto text-primary" />
          <h2 className="mt-4 font-display text-4xl font-bold">Stop babysitting prompts.</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Let Auto Seedance run the queue while you focus on the next idea.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/extension"><Button size="lg" className="btn-gradient text-white border-0 h-12 px-6"><Download className="size-4 mr-2" /> Install Extension</Button></Link>
            <Link to="/dashboard"><Button size="lg" variant="outline" className="h-12 px-6 border-border bg-muted/50"><Clock className="mr-2 size-4" /> Open Dashboard</Button></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
