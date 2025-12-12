import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Calendar,
  MessageSquare,
  DollarSign,
  FileText,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Scale,
  CheckCircle2,
  Users,
  Receipt,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NotFound from "./NotFound";

type FeatureSlug = "smart-calendar" | "secure-messaging" | "expense-tracking" | "document-management";

const featureContent: Record<
  FeatureSlug,
  {
    title: string;
    summary: string;
    icon: JSX.Element;
    heroGradient: string;
    highlights: Array<{ title: string; description: string }>;
    deepDive: Array<{ heading: string; points: string[] }>;
    metrics: Array<{ label: string; value: string }>;
    cta: { primary: string; secondary: string };
  }
> = {
  "smart-calendar": {
    title: "Smart Custody Calendar",
    summary:
      "A unified, color-coded calendar that keeps both parents aligned on custody schedules, school events, medical appointments, and more.",
    icon: <Calendar className="w-10 h-10 text-green-600" />,
    heroGradient: "from-bridge-green/10 via-bridge-blue/10 to-bridge-green/5",
    highlights: [
      {
        title: "Unified Visibility",
        description:
          "Both parents share a single source of truth with color-coded events for custody days, holidays, school activities, and medical visits.",
      },
      {
        title: "Conflict-Free Swaps",
        description:
          "Bridge-it mediates swap requests and flags conflicts automatically so conversations stay collaborative.",
      },
      {
        title: "Predictive Assistance",
        description:
          "AI looks ahead to identify potential custody clashes and gently nudges parents to resolve them before they become issues.",
      },
    ],
    deepDive: [
      {
        heading: "What Makes It Different",
        points: [
          "Color-coded, court-friendly categorization keeps obligations crystal clear.",
          "Shared calendar feels familiar while adding Bridge-it's intelligent guidance.",
          "Mobile-friendly experience with optimistic updates and offline caching.",
        ],
      },
      {
        heading: "How Bridge-it Helps",
        points: [
          "Suggests fair trade-offs when conflicts appear on the schedule.",
          "Sends gentle reminders for pickups, drop-offs, and packing lists.",
          "Keeps a complete audit trail of every change for legal peace of mind.",
        ],
      },
    ],
    metrics: [
      { label: "Custody Swaps Resolved", value: "92% without escalation" },
      { label: "On-Time Exchanges", value: "+37% improvement" },
      { label: "Planning Time Saved", value: "~4 hrs/month" },
    ],
    cta: {
      primary: "Start a Shared Calendar",
      secondary: "Explore Other Features",
    },
  },
  "secure-messaging": {
    title: "Secure Messaging & Mediation",
    summary:
      "Tone-aware messaging that keeps co-parent conversations civil, logged, and court-ready without feeling sterile.",
    icon: <MessageSquare className="w-10 h-10 text-blue-600" />,
    heroGradient: "from-bridge-blue/10 via-purple-100 to-bridge-blue/5",
    highlights: [
      {
        title: "Tone Selection",
        description:
          "Choose the tone you want—friendly, matter-of-fact, or neutral legal—before you send. Bridge-it adjusts suggestions accordingly.",
      },
      {
        title: "Immutable Logs",
        description:
          "Every message is timestamped, locked, and exportable for court proceedings without manual effort.",
      },
      {
        title: "AI Mediation",
        description:
          "Bridge-it steps in with gentle rephrasing when conversations heat up, helping both sides stay focused on the kids.",
      },
    ],
    deepDive: [
      {
        heading: "Messaging Built for Co-Parents",
        points: [
          "Structured threads by topic keep conversations organized.",
          "Receipt sharing, decision approvals, and task assignments in-line.",
          "Role-based permissions so kids’ info never leaks outside the family.",
        ],
      },
      {
        heading: "Safety & Compliance",
        points: [
          "End-to-end encryption with tamper-proof archives.",
          "Instant PDF exports for mediators, attorneys, or courts.",
          "AI-powered toxicity detection to cool off high-stress replies.",
        ],
      },
    ],
    metrics: [
      { label: "Conflict De-escalation", value: "76% of flagged threads" },
      { label: "Message Response Time", value: "-42% faster replies" },
      { label: "Court Export Requests", value: "< 2 min prep" },
    ],
    cta: {
      primary: "Send Your First Message",
      secondary: "See Bridge-it in Action",
    },
  },
  "expense-tracking": {
    title: "Expense Tracking & Reimbursements",
    summary:
      "Crystal-clear expense logging, automated split calculations, and structured dispute resolution that keeps finances transparent.",
    icon: <DollarSign className="w-10 h-10 text-red-600" />,
    heroGradient: "from-bridge-red/10 via-orange-100 to-rose-50",
    highlights: [
      {
        title: "Automatic Splits",
        description:
          "Bridge-it applies the custody agreement ratio to every expense so contributions stay equitable without spreadsheets.",
      },
      {
        title: "Receipt Vault",
        description:
          "Upload photos, PDFs, or email receipts and tag them to categories like education, health, or extracurriculars.",
      },
      {
        title: "Structured Resolution",
        description:
          "If something's disputed, Bridge-it walks both parents through a calm, step-by-step resolution workflow.",
      },
    ],
    deepDive: [
      {
        heading: "Financial Transparency",
        points: [
          "Track pending, approved, and reimbursed statuses in one ledger.",
          "Generate month-end statements ready for accountants or courts.",
          "Sync to shared calendar so financial events never sneak up.",
        ],
      },
      {
        heading: "Supportive Automation",
        points: [
          "Smart reminders ensure reimbursements aren’t forgotten.",
          "Currency-aware calculations for international families.",
          "Snapshot dashboards show who owes what at a glance.",
        ],
      },
    ],
    metrics: [
      { label: "Reimbursement Time", value: "-55% faster resolutions" },
      { label: "Receipt Compliance", value: "98% attached with proof" },
      { label: "Monthly Reports", value: "1-click PDF export" },
    ],
    cta: {
      primary: "Log an Expense",
      secondary: "Review Custody Agreement",
    },
  },
  "document-management": {
    title: "Document Management & Audit Logs",
    summary:
      "Upload agreements, let Bridge-it parse key clauses, and maintain a sealed audit trail ready for mediators and courts.",
    icon: <FileText className="w-10 h-10 text-purple-600" />,
    heroGradient: "from-purple-100 via-bridge-blue/10 to-purple-50",
    highlights: [
      {
        title: "AI Contract Parsing",
        description:
          "Bridge-it extracts custody schedules, decision-making rules, and expense ratios automatically from agreements.",
      },
      {
        title: "Guided Summaries",
        description:
          "If you don't have a PDF handy, answer Bridge-it's guided questionnaire to capture key legal commitments.",
      },
      {
        title: "Court-Ready Audit Logs",
        description:
          "Every action—messages, calendar updates, expenses—is tracked with immutable logging for legal confidence.",
      },
    ],
    deepDive: [
      {
        heading: "Stay Organized",
        points: [
          "Secure vault with granular permissions for co-parents, mediators, and legal teams.",
          "Smart tagging by child, category, and legal requirement.",
          "Version history keeps older agreements accessible without confusion.",
        ],
      },
      {
        heading: "Compliance & Security",
        points: [
          "SOC 2-ready infrastructure with encrypted storage.",
          "Download consolidated case files in minutes.",
          "Automated reminders when documents need updates or signatures.",
        ],
      },
    ],
    metrics: [
      { label: "Document Retrieval", value: "< 10 seconds avg." },
      { label: "Agreement Coverage", value: "100% clause extraction" },
      { label: "Audit Accuracy", value: "Court-admissible logs" },
    ],
    cta: {
      primary: "Upload a Custody Agreement",
      secondary: "Browse Audit Trail",
    },
  },
};

const FeatureDetail: React.FC = () => {
  const { slug } = useParams<{ slug: FeatureSlug }>();

  const feature = useMemo(() => {
    if (!slug) return undefined;
    return featureContent[slug];
  }, [slug]);

  if (!slug || !feature) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-bridge-green/5 to-bridge-blue/5">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
            <div className="flex items-center space-x-2">
              <img src="/bridgette-avatar.png" alt="Bridge-it Logo" className="w-8 h-8" />
              <span className="text-xl font-semibold text-slate-900">Bridge-it</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button variant="outline" className="border-bridge-blue text-bridge-blue hover:bg-bridge-blue hover:text-white">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button
                className="bg-bridge-yellow text-bridge-blue hover:bg-bridge-yellow/90 border-2 border-bridge-yellow font-bold"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <section className={`rounded-3xl border border-slate-200 bg-gradient-to-r ${feature.heroGradient} p-8`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-6 max-w-2xl">
              <Badge className="bg-slate-900 text-white w-fit px-3 py-1 text-sm">Bridge-it Feature</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900">{feature.title}</h1>
              <p className="text-lg text-slate-700 leading-relaxed">{feature.summary}</p>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-inner">{feature.icon}</div>
                <div className="text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Designed around PRD requirements</p>
                  <p>Fair, transparent, and child-first by default.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="flex items-center space-x-2 bg-white text-slate-800 border border-slate-200">
                  <Scale className="w-4 h-4" />
                  <span>Fair & Balanced</span>
                </Badge>
                <Badge variant="secondary" className="flex items-center space-x-2 bg-white text-slate-800 border border-slate-200">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Court Ready</span>
                </Badge>
                <Badge variant="secondary" className="flex items-center space-x-2 bg-white text-slate-800 border border-slate-200">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Assisted</span>
                </Badge>
              </div>
            </div>
            <Card className="md:w-80 bg-white shadow-xl border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900">
                  <Users className="w-5 h-5 text-bridge-blue" />
                  <span>Impact at a Glance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {feature.metrics.map((metric) => (
                  <div key={metric.label} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{metric.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feature.highlights.map((highlight) => (
            <Card key={highlight.title} className="border-2 border-slate-200 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900">
                  <CheckCircle2 className="w-5 h-5 text-bridge-green" />
                  <span>{highlight.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">{highlight.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-6">
          {feature.deepDive.map((section) => (
            <Card key={section.heading} className="border border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50 border-b border-slate-200">
                <CardTitle className="text-xl text-slate-900 flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-bridge-blue" />
                  <span>{section.heading}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-6">
                {section.points.map((point) => (
                  <div key={point} className="flex items-start space-x-3">
                    <div className="w-5 h-5 mt-1 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-bridge-blue" />
                    </div>
                    <p className="text-slate-600 leading-relaxed">{point}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl bg-slate-900 text-white p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">{feature.cta.primary}</h2>
            <p className="text-slate-200 max-w-xl">
              Bridge-it will guide you through setup, connect your co-parent with a Family Code, and keep everything organized from day one.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  {feature.cta.primary}
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  {feature.cta.secondary}
                </Button>
              </Link>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-bridge-green" />
              <p className="text-sm">Private, secure, and court-admissible records.</p>
            </div>
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-bridge-yellow" />
              <p className="text-sm">AI guidance tuned for empathy, not automation.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm">Bridge-it • Fair & Balanced Co-Parenting</p>
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} Bridge-it. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/" className="text-sm hover:text-white">
              Home
            </Link>
            <Link to="/login" className="text-sm hover:text-white">
              Login
            </Link>
            <Link to="/signup" className="text-sm hover:text-white">
              Create Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FeatureDetail;

