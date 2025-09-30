import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, TrendingUp, Users, DollarSign, LogOut } from "lucide-react";
import { CompanySetup } from "@/components/CompanySetup";
import { SafeRound } from "@/components/SafeRound";
import { PricingRound } from "@/components/PricingRound";
import { OwnershipTable } from "@/components/OwnershipTable";
import { Auth } from "@/components/Auth";
import { useCompanyData } from "@/hooks/useCompanyData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export interface Company {
  name: string;
  foundersShares: number;
  totalShares: number;
  initialValuation: number;
}

export interface SafeInvestment {
  id: string;
  investorName: string;
  amount: number;
  discount: number;
  valuationCap?: number;
  converted: boolean;
}

export interface PricingRoundData {
  id: string;
  name: string;
  preMoneyValuation: number;
  investment: number;
  newInvestors: Array<{
    name: string;
    investment: number;
  }>;
}

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("setup");

  const {
    company,
    safeRounds,
    pricingRounds,
    loading,
    saveCompany,
    saveSafeRound,
    savePricingRound,
  } = useCompanyData(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const handleCompanySetup = async (companyData: Company) => {
    await saveCompany(companyData);
    setActiveTab("safe");
  };

  if (!user) {
    return <Auth />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-bold text-primary">
              Startup Equity Scenario Builder
            </h1>
            <p className="text-base md:text-lg text-muted-foreground px-4">
              Model ownership changes across funding rounds and calculate founder returns
            </p>
          </div>

          <Card className="mx-auto max-w-2xl bg-card border border-primary/20 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-end mb-2">
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
              <CardTitle className="flex items-center justify-center gap-2 text-xl md:text-2xl">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                Get Started
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Set up your company details to begin modeling equity scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanySetup onSetup={handleCompanySetup} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex justify-between items-start">
          <div>
            <h1 className="mb-2 text-2xl md:text-3xl font-bold text-foreground">{company.name}</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Initial Valuation: ${company.initialValuation.toLocaleString()} •
              Founder Shares: {company.foundersShares.toLocaleString()}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 md:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="bg-card border border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">SAFE Rounds</p>
                  <p className="text-xl md:text-2xl font-bold text-primary">{safeRounds.length}</p>
                </div>
                <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-primary/20">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Pricing Rounds</p>
                  <p className="text-xl md:text-2xl font-bold text-primary">{pricingRounds.length}</p>
                </div>
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-primary/20 sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Raised</p>
                  <p className="text-xl md:text-2xl font-bold text-primary">
                    ${(safeRounds.reduce((sum, safe) => sum + safe.amount, 0) +
                      pricingRounds.reduce((sum, round) => sum + round.investment, 0)).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50 backdrop-blur-sm h-auto">
            <TabsTrigger 
              value="safe" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm py-2 md:py-3"
            >
              SAFE Rounds
            </TabsTrigger>
            <TabsTrigger 
              value="pricing" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm py-2 md:py-3"
            >
              Pricing Rounds
            </TabsTrigger>
            <TabsTrigger 
              value="ownership" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs md:text-sm py-2 md:py-3"
            >
              Ownership
            </TabsTrigger>
          </TabsList>

          <TabsContent value="safe" className="space-y-4 md:space-y-6">
            <Card className="bg-card border border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <PlusCircle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      SAFE Investment Rounds
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Add SAFE investors with discount rates and valuation caps
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SafeRound onAddSafe={saveSafeRound} existingSafes={safeRounds} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4 md:space-y-6">
            <Card className="bg-card border border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  Pricing Rounds
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Add equity financing rounds with pre-money valuations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PricingRound
                  onAddRound={savePricingRound}
                  company={company}
                  safeRounds={safeRounds}
                  existingRounds={pricingRounds}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ownership" className="space-y-4 md:space-y-6">
            <OwnershipTable
              company={company}
              safeRounds={safeRounds}
              pricingRounds={pricingRounds}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
