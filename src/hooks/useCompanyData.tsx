import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Company, SafeInvestment, PricingRoundData } from "@/pages/Index";

export const useCompanyData = (userId: string | undefined) => {
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [safeRounds, setSafeRounds] = useState<SafeInvestment[]>([]);
  const [pricingRounds, setPricingRounds] = useState<PricingRoundData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    try {
      // Load company
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (companyError) throw companyError;

      if (companyData) {
        setCompany({
          name: companyData.name,
          foundersShares: Number(companyData.founders_shares),
          totalShares: Number(companyData.total_shares),
          initialValuation: Number(companyData.initial_valuation),
        });
        setCompanyId(companyData.id);

        // Load SAFE rounds
        const { data: safeData, error: safeError } = await supabase
          .from("safe_investments")
          .select("*")
          .eq("company_id", companyData.id)
          .order("created_at", { ascending: true });

        if (safeError) throw safeError;

        if (safeData) {
          setSafeRounds(
            safeData.map((safe) => ({
              id: safe.id,
              investorName: safe.investor_name,
              amount: Number(safe.amount),
              discount: Number(safe.discount),
              valuationCap: safe.valuation_cap ? Number(safe.valuation_cap) : undefined,
              converted: safe.converted,
            }))
          );
        }

        // Load pricing rounds
        const { data: pricingData, error: pricingError } = await supabase
          .from("pricing_rounds")
          .select(`
            *,
            pricing_round_investors (
              id,
              name,
              investment
            )
          `)
          .eq("company_id", companyData.id)
          .order("created_at", { ascending: true });

        if (pricingError) throw pricingError;

        if (pricingData) {
          setPricingRounds(
            pricingData.map((round: any) => ({
              id: round.id,
              name: round.name,
              preMoneyValuation: Number(round.pre_money_valuation),
              investment: Number(round.investment),
              newInvestors: round.pricing_round_investors.map((inv: any) => ({
                name: inv.name,
                investment: Number(inv.investment),
              })),
            }))
          );
        }
      }
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCompany = async (companyData: Company) => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          user_id: userId,
          name: companyData.name,
          founders_shares: companyData.foundersShares,
          total_shares: companyData.totalShares,
          initial_valuation: companyData.initialValuation,
        })
        .select()
        .single();

      if (error) throw error;

      setCompany(companyData);
      setCompanyId(data.id);
      
      toast({
        title: "Company Setup Complete",
        description: `${companyData.name} configured successfully`,
      });

      return data.id;
    } catch (error: any) {
      toast({
        title: "Error saving company",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveSafeRound = async (safeData: Omit<SafeInvestment, "id" | "converted">) => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from("safe_investments")
        .insert({
          company_id: companyId,
          investor_name: safeData.investorName,
          amount: safeData.amount,
          discount: safeData.discount,
          valuation_cap: safeData.valuationCap,
        })
        .select()
        .single();

      if (error) throw error;

      const newSafe: SafeInvestment = {
        id: data.id,
        investorName: data.investor_name,
        amount: Number(data.amount),
        discount: Number(data.discount),
        valuationCap: data.valuation_cap ? Number(data.valuation_cap) : undefined,
        converted: data.converted,
      };

      setSafeRounds((prev) => [...prev, newSafe]);

      toast({
        title: "SAFE Round Added",
        description: `${safeData.investorName} - $${safeData.amount.toLocaleString()}`,
      });
    } catch (error: any) {
      toast({
        title: "Error saving SAFE round",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const savePricingRound = async (roundData: Omit<PricingRoundData, "id">) => {
    if (!companyId) return;

    try {
      // Insert pricing round
      const { data: roundInsert, error: roundError } = await supabase
        .from("pricing_rounds")
        .insert({
          company_id: companyId,
          name: roundData.name,
          pre_money_valuation: roundData.preMoneyValuation,
          investment: roundData.investment,
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // Insert investors
      const investorsToInsert = roundData.newInvestors.map((inv) => ({
        pricing_round_id: roundInsert.id,
        name: inv.name,
        investment: inv.investment,
      }));

      const { error: investorsError } = await supabase
        .from("pricing_round_investors")
        .insert(investorsToInsert);

      if (investorsError) throw investorsError;

      // Mark SAFE rounds as converted
      if (safeRounds.length > 0) {
        const { error: updateError } = await supabase
          .from("safe_investments")
          .update({ converted: true })
          .eq("company_id", companyId);

        if (updateError) throw updateError;

        setSafeRounds((prev) =>
          prev.map((safe) => ({ ...safe, converted: true }))
        );
      }

      const newRound: PricingRoundData = {
        id: roundInsert.id,
        name: roundInsert.name,
        preMoneyValuation: Number(roundInsert.pre_money_valuation),
        investment: Number(roundInsert.investment),
        newInvestors: roundData.newInvestors,
      };

      setPricingRounds((prev) => [...prev, newRound]);

      toast({
        title: "Pricing Round Added",
        description: `${roundData.name} - $${roundData.investment.toLocaleString()} raised`,
      });
    } catch (error: any) {
      toast({
        title: "Error saving pricing round",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    company,
    safeRounds,
    pricingRounds,
    loading,
    saveCompany,
    saveSafeRound,
    savePricingRound,
  };
};
