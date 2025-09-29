import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, TrendingUp, Users, DollarSign } from "lucide-react";
import { CompanySetup } from "@/components/CompanySetup";
import { SafeRound } from "@/components/SafeRound";
import { PricingRound } from "@/components/PricingRound";
import { OwnershipTable } from "@/components/OwnershipTable";
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
  const [company, setCompany] = useState<Company | null>(null);
  const [safeRounds, setSafeRounds] = useState<SafeInvestment[]>([]);
  const [pricingRounds, setPricingRounds] = useState<PricingRoundData[]>([]);
  const [activeTab, setActiveTab] = useState("setup");

  const handleCompanySetup = useCallback((companyData: Company) => {
    setCompany(companyData);
    setActiveTab("safe");
    toast({
      title: "Company Setup Complete",
      description: `${companyData.name} configured with ${companyData.foundersShares.toLocaleString()} founder shares`,
    });
  }, [toast]);

  const handleSafeRound = useCallback((safeData: Omit<SafeInvestment, 'id' | 'converted'>) => {
    const newSafe: SafeInvestment = {
      ...safeData,
      id: Math.random().toString(36).substr(2, 9),
      converted: false,
    };
    setSafeRounds(prev => [...prev, newSafe]);
    toast({
      title: "SAFE Round Added",
      description: `${safeData.investorName} - $${safeData.amount.toLocaleString()}`,
    });
  }, [toast]);

  const handlePricingRound = useCallback((roundData: Omit<PricingRoundData, 'id'>) => {
    const newRound: PricingRoundData = {
      ...roundData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setPricingRounds(prev => [...prev, newRound]);

    // Mark SAFE rounds as converted
    setSafeRounds(prev => prev.map(safe => ({ ...safe, converted: true })));

    toast({
      title: "Pricing Round Added",
      description: `${roundData.name} - $${roundData.investment.toLocaleString()} raised`,
    });
  }, [toast]);

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
        <div className="mb-6 md:mb-8">
          <h1 className="mb-2 text-2xl md:text-3xl font-bold text-foreground">{company.name}</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Initial Valuation: ${company.initialValuation.toLocaleString()} •
            Founder Shares: {company.foundersShares.toLocaleString()}
          </p>
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
                <SafeRound onAddSafe={handleSafeRound} existingSafes={safeRounds} />
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
                  onAddRound={handlePricingRound}
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
