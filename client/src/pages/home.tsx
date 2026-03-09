import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, TrendingUp, Users, Lightbulb, ExternalLink, Menu, X } from "lucide-react";
import logoPath from "@assets/Logo_of_Touch_Equity_Partners_1773071901628.png";
import { useState, useEffect } from "react";

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      data-testid="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16 sm:h-20">
          <button
            onClick={() => scrollTo("hero")}
            className="flex items-center gap-2 flex-shrink-0"
            data-testid="link-home-logo"
          >
            <img src={logoPath} alt="Touch Equity Partners" className="h-10 sm:h-12 w-auto" />
          </button>

          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => scrollTo("hero")}
              className="px-3 py-2 text-sm font-medium text-foreground/80 rounded-md transition-colors"
              data-testid="link-nav-home"
            >
              Home
            </button>
            <button
              onClick={() => scrollTo("mission")}
              className="px-3 py-2 text-sm font-medium text-foreground/80 rounded-md transition-colors"
              data-testid="link-nav-mission"
            >
              Mission
            </button>
            <button
              onClick={() => scrollTo("what-we-do")}
              className="px-3 py-2 text-sm font-medium text-foreground/80 rounded-md transition-colors"
              data-testid="link-nav-whatwedo"
            >
              What We Do
            </button>
            <button
              onClick={() => scrollTo("portfolio")}
              className="px-3 py-2 text-sm font-medium text-foreground/80 rounded-md transition-colors"
              data-testid="link-nav-portfolio"
            >
              Portfolio
            </button>
            <Link href="/login">
              <Button size="sm" data-testid="link-nav-login">
                Customer Login
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b">
          <div className="px-4 py-3 space-y-1">
            <button
              onClick={() => scrollTo("hero")}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 rounded-md"
              data-testid="link-mobile-home"
            >
              Home
            </button>
            <button
              onClick={() => scrollTo("mission")}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 rounded-md"
              data-testid="link-mobile-mission"
            >
              Mission
            </button>
            <button
              onClick={() => scrollTo("what-we-do")}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 rounded-md"
              data-testid="link-mobile-whatwedo"
            >
              What We Do
            </button>
            <button
              onClick={() => scrollTo("portfolio")}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 rounded-md"
              data-testid="link-mobile-portfolio"
            >
              Portfolio
            </button>
            <Link href="/login">
              <Button size="sm" className="w-full mt-2" data-testid="link-mobile-login">
                Customer Login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center justify-center bg-primary"
      data-testid="section-hero"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(220,56%,12%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32">
        <img
          src={logoPath}
          alt="Touch Equity Partners"
          className="h-20 sm:h-28 w-auto mx-auto mb-8 brightness-0 invert"
          data-testid="img-hero-logo"
        />
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4"
          data-testid="text-hero-title"
        >
          Touch Equity Partners
        </h1>
        <p className="text-lg sm:text-xl text-white/80 font-medium mb-8" data-testid="text-hero-subtitle">
          Building Long-Term Partnerships with Business Owners
        </p>
        <div className="max-w-2xl mx-auto space-y-4 mb-10">
          <p className="text-base sm:text-lg text-white/70 leading-relaxed" data-testid="text-hero-desc1">
            Touch Equity Partners is a collective of private investors and entrepreneurs
            supporting startups and growing businesses.
          </p>
          <p className="text-base sm:text-lg text-white/70 leading-relaxed" data-testid="text-hero-desc2">
            We focus on long-term partnerships and help founders strengthen their strategy,
            prepare for fundraising, and connect with the right investors.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-white/60" data-testid="text-hero-location">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">San Diego, California</span>
        </div>
      </div>
    </section>
  );
}

function WhatWeDoSection() {
  const services = [
    {
      icon: TrendingUp,
      title: "Startup & Growth Investments",
      description:
        "We support promising startups and growing businesses with funding, guidance, and access to our investor network.",
    },
    {
      icon: Lightbulb,
      title: "Advisory & Strategic Support",
      description:
        "Our platform TouchConnectPro helps founders prepare for fundraising, connect with private investors, and make smarter financial decisions.",
    },
    {
      icon: Users,
      title: "Entrepreneurs Supporting Entrepreneurs",
      description:
        "We are founders ourselves and understand the challenges of building companies. Our goal is to help founders build strong foundations before major funding rounds.",
    },
  ];

  return (
    <section id="what-we-do" className="py-20 sm:py-28 bg-background" data-testid="section-whatwedo">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight" data-testid="text-whatwedo-title">
            What We Do
          </h2>
          <div className="w-12 h-0.5 bg-primary mx-auto mt-4" />
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => (
            <Card key={index} className="border-none bg-muted/40" data-testid={`card-service-${index}`}>
              <CardContent className="pt-8 pb-8 px-6 text-center">
                <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section id="mission" className="py-20 sm:py-28 bg-muted/30" data-testid="section-mission">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight" data-testid="text-mission-title">
            Our Mission
          </h2>
          <div className="w-12 h-0.5 bg-primary mx-auto mt-4" />
        </div>

        <div className="space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed text-center">
          <p data-testid="text-mission-p1">
            Touch Equity Partners focuses on building long-term partnerships with founders
            and business owners.
          </p>
          <p data-testid="text-mission-p2">
            Having built and grown our own companies, we understand the challenges
            entrepreneurs face when trying to raise capital and scale.
          </p>
          <p data-testid="text-mission-p3">
            We step in before major funding rounds to help founders strengthen their strategy,
            improve their financial structure, and connect with the right investors.
          </p>
          <p data-testid="text-mission-p4" className="italic text-foreground/70">
            In business, as in poker, it is smart to stay in the game. But going all-in with
            the wrong partners can be costly. We help founders find investors who share their
            vision and are committed for the long term.
          </p>
        </div>
      </div>
    </section>
  );
}

function PortfolioSection() {
  const companies = [
    { name: "TouchConnectPro", description: "Fundraising & investor connection platform" },
    { name: "The Accounting Touch", description: "Financial services for growing businesses" },
    { name: "The Expenses Touch", description: "Expense management solutions" },
    { name: "Hotel Service RAS", description: "Hospitality industry services" },
  ];

  return (
    <section id="portfolio" className="py-20 sm:py-28 bg-background" data-testid="section-portfolio">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight" data-testid="text-portfolio-title">
            Portfolio Startups
          </h2>
          <div className="w-12 h-0.5 bg-primary mx-auto mt-4" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {companies.map((company, index) => (
            <Card key={index} className="border-none bg-muted/40 hover-elevate" data-testid={`card-portfolio-${index}`}>
              <CardContent className="py-8 px-5 text-center">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{company.name}</h3>
                <p className="text-xs text-muted-foreground">{company.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-primary text-white py-12" data-testid="section-footer">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <img
          src={logoPath}
          alt="Touch Equity Partners"
          className="h-10 w-auto mx-auto mb-4 brightness-0 invert"
          data-testid="img-footer-logo"
        />
        <p className="font-semibold text-white/90 mb-1" data-testid="text-footer-name">
          Touch Equity Partners
        </p>
        <p className="text-sm text-white/60 mb-1" data-testid="text-footer-since">
          Founder & Investor since 2015
        </p>
        <div className="flex items-center justify-center gap-1.5 text-sm text-white/50">
          <MapPin className="w-3.5 h-3.5" />
          <span data-testid="text-footer-location">San Diego, California</span>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <WhatWeDoSection />
      <MissionSection />
      <PortfolioSection />
      <Footer />
    </div>
  );
}
