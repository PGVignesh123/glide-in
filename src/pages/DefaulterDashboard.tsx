import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Filter, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Defaulter {
  id: string;
  name: string;
  loanAmount: number;
  daysPastDue: number;
  paymentScore: number;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  collectionCost: number;
  propensityScore?: number;
  rank?: number;
}

const DefaulterDashboard = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('All Risk Levels');
  const [configuredCategories, setConfiguredCategories] = useState(0);

  useEffect(() => {
    const savedCategories = localStorage.getItem('riskCategories');
    if (savedCategories) {
      const categories = JSON.parse(savedCategories);
      const configuredCount = categories.filter((cat: any) => cat.conditions.length > 0).length;
      setConfiguredCategories(configuredCount);
    }
  }, []);

  const [defaulters] = useState<Defaulter[]>([
    { id: '1', name: 'John Anderson', loanAmount: 45000, daysPastDue: 90, paymentScore: 25, riskLevel: 'High', collectionCost: 3500 },
    { id: '2', name: 'Sarah Mitchell', loanAmount: 78000, daysPastDue: 180, paymentScore: 15, riskLevel: 'Critical', collectionCost: 8500 },
    { id: '3', name: 'Michael Rodriguez', loanAmount: 32000, daysPastDue: 45, paymentScore: 55, riskLevel: 'Medium', collectionCost: 2100 },
    { id: '4', name: 'Emily Chen', loanAmount: 125000, daysPastDue: 210, paymentScore: 8, riskLevel: 'Critical', collectionCost: 12000 },
    { id: '5', name: 'David Thompson', loanAmount: 28500, daysPastDue: 30, paymentScore: 72, riskLevel: 'Low', collectionCost: 1200 },
    { id: '6', name: 'Lisa Wang', loanAmount: 56000, daysPastDue: 120, paymentScore: 35, riskLevel: 'High', collectionCost: 4200 },
    { id: '7', name: 'Robert Johnson', loanAmount: 89000, daysPastDue: 75, paymentScore: 42, riskLevel: 'Medium', collectionCost: 3800 },
    { id: '8', name: 'Maria Garcia', loanAmount: 67500, daysPastDue: 150, paymentScore: 18, riskLevel: 'Critical', collectionCost: 6500 },
    { id: '9', name: 'James Wilson', loanAmount: 41000, daysPastDue: 60, paymentScore: 48, riskLevel: 'Medium', collectionCost: 2800 },
    { id: '10', name: 'Jennifer Brown', loanAmount: 95000, daysPastDue: 195, paymentScore: 12, riskLevel: 'Critical', collectionCost: 9800 }
  ]);

  const totalDefaulters = defaulters.length;
  const totalLoanAmount = defaulters.reduce((sum, d) => sum + d.loanAmount, 0);
  const avgDaysPastDue = Math.round(defaulters.reduce((sum, d) => sum + d.daysPastDue, 0) / defaulters.length);
  const totalCollectionCost = defaulters.reduce((sum, d) => sum + d.collectionCost, 0);
  const avgPaymentScore = Math.round(defaulters.reduce((sum, d) => sum + d.paymentScore, 0) / defaulters.length);

  const riskDistribution = {
    Critical: defaulters.filter(d => d.riskLevel === 'Critical').length,
    High: defaulters.filter(d => d.riskLevel === 'High').length,
    Medium: defaulters.filter(d => d.riskLevel === 'Medium').length,
    Low: defaulters.filter(d => d.riskLevel === 'Low').length,
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const exportData = () => {
    toast({
      title: "Export Started",
      description: "Your data is being exported. Download will start shortly.",
    });
  };

  // Define proper weights so high risk gives lower propensity score
  const riskWeight = {
    'Critical': 0.3,
    'High': 0.5,
    'Medium': 0.8,
    'Low': 1.0,
  };

  // Compute Propensity Score and Rank
  const defaultersWithPropensity = defaulters.map(defaulter => {
    const baseScore =
      defaulter.daysPastDue * 0.5 +
      (100 - defaulter.paymentScore) * 0.3 +
      (defaulter.collectionCost / 1000) * 0.2;

    const propensityScore = baseScore * riskWeight[defaulter.riskLevel];

    return { ...defaulter, propensityScore };
  });

  const rankedDefaulters = [...defaultersWithPropensity]
    .sort((a, b) => b.propensityScore - a.propensityScore)
    .map((defaulter, index) => ({ ...defaulter, rank: index + 1 }));

  const filteredDefaulters = rankedDefaulters.filter(defaulter => {
    const matchesSearch = defaulter.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'All Risk Levels' || defaulter.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Defaulter Scoring Dashboard</h1>
          <p className="text-muted-foreground">Track and manage loan defaulters with risk-based scoring</p>
        </div>
        <Button onClick={exportData} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Defaulters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDefaulters}</div>
            <p className="text-xs text-muted-foreground">Active accounts in default</p>
            <div className="mt-2">
              <Badge variant={configuredCategories > 0 ? "default" : "secondary"}>
                {configuredCategories} Categories Configured
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Loan Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLoanAmount)}</div>
            <p className="text-xs text-muted-foreground">Outstanding loan principal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Days Past Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDaysPastDue}</div>
            <p className="text-xs text-muted-foreground">Average delinquency period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collection Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCollectionCost)}</div>
            <p className="text-xs text-muted-foreground">Total estimated collection cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Payment Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPaymentScore}%</div>
            <p className="text-xs text-muted-foreground">Average payment history score</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <p className="text-sm text-muted-foreground">Distribution of defaulters by risk segment</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-risk-critical text-white">Critical</Badge>
              <span className="text-sm">{riskDistribution.Critical} accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-risk-high text-white">High</Badge>
              <span className="text-sm">{riskDistribution.High} accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-risk-medium text-white">Medium</Badge>
              <span className="text-sm">{riskDistribution.Medium} accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-risk-low text-white">Low</Badge>
              <span className="text-sm">{riskDistribution.Low} accounts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search defaulters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Risk Levels">All Risk Levels</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Showing {filteredDefaulters.length} of {totalDefaulters} defaulters
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Defaulters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Defaulters List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Defaulter Name</th>
                  <th className="text-left p-4 font-medium">Loan Amount</th>
                  <th className="text-left p-4 font-medium">Days Past Due</th>
                  <th className="text-left p-4 font-medium">Payment History Score</th>
                  <th className="text-left p-4 font-medium">Segment Risk</th>
                  <th className="text-left p-4 font-medium">Cost to Collect</th>
                  <th className="text-left p-4 font-medium">Propensity Score</th>
                  <th className="text-left p-4 font-medium">Rank</th>
                </tr>
              </thead>
              <tbody>
                {filteredDefaulters.map((defaulter) => (
                  <tr key={defaulter.id} className="border-b hover:bg-muted/25">
                    <td className="p-4 font-medium">{defaulter.name}</td>
                    <td className="p-4">{formatCurrency(defaulter.loanAmount)}</td>
                    <td className="p-4">{defaulter.daysPastDue}</td>
                    <td className="p-4">
                      <span className={`font-medium ${
                        defaulter.paymentScore < 20 ? 'text-risk-critical' :
                        defaulter.paymentScore < 40 ? 'text-risk-high' :
                        defaulter.paymentScore < 60 ? 'text-risk-medium' : 'text-risk-low'
                      }`}>
                        {defaulter.paymentScore}%
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={getRiskBadgeVariant(defaulter.riskLevel)}>
                        {defaulter.riskLevel}
                      </Badge>
                    </td>
                    <td className="p-4">{formatCurrency(defaulter.collectionCost)}</td>
                    <td className="p-4">{defaulter.propensityScore!.toFixed(2)}</td>
                    <td className="p-4">{defaulter.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DefaulterDashboard;
