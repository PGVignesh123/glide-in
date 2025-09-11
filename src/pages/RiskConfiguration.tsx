import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RiskCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  weight: number;
  dataType: string;
  configId?: number;
  riskFieldId?: number;
}

interface ApiConfigItem {
  ConfigId: number;
  RiskFieldId: number;
  Operator: string;
  Value: string;
  WeightPercentage: number;
  CreatedAt: string;
  IsEnabled: boolean;
  FieldName: string;
  DisplayName: string;
}

interface RiskCategory {
  id: string;
  name: string;
  conditions: RiskCondition[];
  totalWeight: number;
  status: "incomplete" | "complete";
}

const RiskConfiguration = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("financial");
  const [loading, setLoading] = useState(false);

  const fieldOptions = {
    financial: [
      { name: "Loan Amount", dataType: "Number", riskFieldId: 1 },
      { name: "Outstanding Balance", dataType: "Number", riskFieldId: 2 },
      { name: "Days Past Due (DPD)", dataType: "Number", riskFieldId: 3 },
      { name: "Repayment History Score", dataType: "Number", riskFieldId: 4 },
      { name: "Credit Score (Experian/Equifax)", dataType: "Number", riskFieldId: 5 },
      { name: "Credit Utilisation Ratio", dataType: "Percentage", riskFieldId: 6 },
      { name: "Previous Defaults (count)", dataType: "Number", riskFieldId: 7 },
      { name: "Cost-to-Collect Estimate", dataType: "Number", riskFieldId: 8 },
    ],
    identity: [
      { name: "Name Match %", dataType: "Percentage", riskFieldId: 9 },
      { name: "Address Match %", dataType: "Percentage", riskFieldId: 10 },
      { name: "DOB Match", dataType: "Boolean", riskFieldId: 11 },
      { name: "National Insurance Number Match", dataType: "Boolean", riskFieldId: 12 },
      { name: "Identity Match Score (Weighted)", dataType: "Number", riskFieldId: 13 },
    ],
    property: [
      { name: "Years at Current Address", dataType: "Number", riskFieldId: 14 },
      { name: "Property Owned (Yes/No)", dataType: "Boolean", riskFieldId: 15 },
      { name: "Property Value", dataType: "Number", riskFieldId: 16 },
      { name: "Home Ownership Status", dataType: "Text", riskFieldId: 17 },
      { name: "Vehicle Owned (Yes/No)", dataType: "Boolean", riskFieldId: 18 },
      { name: "Stability Score", dataType: "Number", riskFieldId: 19 },
    ],
    contactability: [
      { name: "Contact Numbers Available (count)", dataType: "Number", riskFieldId: 20 },
      { name: "Validated Phone Number (Yes/No)", dataType: "Boolean", riskFieldId: 21 },
      { name: "Mobile Number Verified", dataType: "Boolean", riskFieldId: 22 },
      { name: "Number of Contactable Channels", dataType: "Number", riskFieldId: 23 },
      { name: "Agent Recovery Success Rate", dataType: "Percentage", riskFieldId: 24 },
    ],
    risk: [
      { name: "Criminal Record Flag (Yes/No)", dataType: "Boolean", riskFieldId: 25 },
      { name: "History of Defaults/CCJs", dataType: "Boolean", riskFieldId: 26 },
      { name: "Recent Missed Payments", dataType: "Number", riskFieldId: 27 },
      { name: "Same Name Cases Flag", dataType: "Boolean", riskFieldId: 28 },
      { name: "Loan Application Address Risk", dataType: "Text", riskFieldId: 29 },
    ],
  };

  // Modified: Accepts currentField to always include it in the dropdown
  const getAvailableFields = (categoryId: string, currentField?: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    const usedFields = category?.conditions.map((c) => c.field) || [];
    return (
      fieldOptions[categoryId as keyof typeof fieldOptions]?.filter(
        (field) =>
          !usedFields.includes(field.name) || field.name === currentField
      ) || []
    );
  };

  const getOperatorsForDataType = (dataType: string) => {
    switch (dataType) {
      case "Boolean":
        return [{ value: "=", label: "=" }];
      case "Text":
        return [
          { value: "=", label: "=" },
          { value: "!=", label: "!=" },
        ];
      case "Number":
      case "Percentage":
        return [
          { value: ">", label: ">" },
          { value: "<", label: "<" },
          { value: "=", label: "=" },
          { value: ">=", label: "≥" },
          { value: "<=", label: "≤" },
        ];
      default:
        return [
          { value: ">", label: ">" },
          { value: "<", label: "<" },
          { value: "=", label: "=" },
        ];
    }
  };

  const getValueInput = (
    condition: RiskCondition,
    onUpdate: (value: string) => void
  ) => {
    const { dataType, value } = condition;

    if (dataType === "Boolean") {
      return (
        <Select value={value} onValueChange={onUpdate}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (dataType === "Percentage") {
      return (
        <div className="relative">
          <Input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder="0-100"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
            %
          </span>
        </div>
      );
    }

    return (
      <Input
        type={dataType === "Number" ? "number" : "text"}
        value={value}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder={dataType === "Number" ? "0" : "Enter value"}
      />
    );
  };

  const [categories, setCategories] = useState<RiskCategory[]>([
    {
      id: "financial",
      name: "Financial & Credit",
      conditions: [],
      totalWeight: 0,
      status: "incomplete",
    },
    {
      id: "identity",
      name: "Identity & Verification",
      conditions: [],
      totalWeight: 0,
      status: "incomplete",
    },
    {
      id: "property",
      name: "Property & Stability",
      conditions: [],
      totalWeight: 0,
      status: "incomplete",
    },
    {
      id: "contactability",
      name: "Contactability & Behaviour",
      conditions: [],
      totalWeight: 0,
      status: "incomplete",
    },
    {
      id: "risk",
      name: "Risk Factors",
      conditions: [],
      totalWeight: 0,
      status: "incomplete",
    },
  ]);

  // API functions
  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://marstonx-defaulterrankingapp.azurewebsites.net/api/GetConfig');
      const data: ApiConfigItem[] = await response.json();
      
      // Transform API data to UI format
      const transformedCategories = categories.map(category => {
        const categoryConditions = data
          .filter(item => {
            const fieldInfo = Object.values(fieldOptions).flat().find(f => f.name === item.DisplayName);
            return fieldInfo && Object.values(fieldOptions[category.id as keyof typeof fieldOptions] || []).includes(fieldInfo);
          })
          .map(item => ({
            id: item.ConfigId.toString(),
            field: item.DisplayName,
            operator: item.Operator,
            value: item.Value,
            weight: item.WeightPercentage,
            dataType: Object.values(fieldOptions).flat().find(f => f.name === item.DisplayName)?.dataType || "Number",
            configId: item.ConfigId,
            riskFieldId: item.RiskFieldId
          }));

        const totalWeight = categoryConditions.reduce((sum, c) => sum + c.weight, 0);
        
        return {
          ...category,
          conditions: categoryConditions,
          totalWeight,
          status: totalWeight === 100 ? "complete" : "incomplete" as "complete" | "incomplete"
        };
      });

      setCategories(transformedCategories);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfigurations = async () => {
    setLoading(true);
    try {
      // Transform UI data to API format
      const allConditions = categories.flatMap(category => 
        category.conditions.map(condition => ({
          RiskFieldId: condition.riskFieldId || Object.values(fieldOptions).flat().find(f => f.name === condition.field)?.riskFieldId || 1,
          Operator: condition.operator,
          Value: condition.value,
          WeightPercentage: condition.weight
        }))
      );

      const response = await fetch('https://marstonx-defaulterrankingapp.azurewebsites.net/api/SaveConfig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(allConditions)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Risk configurations updated successfully."
        });
      } else {
        throw new Error('Failed to save configurations');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const activeCategory = categories.find((cat) => cat.id === activeTab);

  const addCondition = () => {
    if (!activeCategory) return;

    const newCondition: RiskCondition = {
      id: Date.now().toString(),
      field: "",
      operator: ">",
      value: "",
      weight: 0,
      dataType: "Number",
    };

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === activeTab
          ? { ...cat, conditions: [...cat.conditions, newCondition] }
          : cat
      )
    );
  };

  const removeCondition = (conditionId: string) => {
 setCategories((prev) =>
  prev.map((cat) =>
    cat.id === activeTab
      ? {
          ...cat,
          conditions: cat.conditions.filter((c) => c.id !== conditionId),
          totalWeight: cat.conditions
            .filter((c) => c.id !== conditionId)
            .reduce((sum, c) => sum + c.weight, 0),
          status: cat.conditions
            .filter((c) => c.id !== conditionId)
            .reduce((sum, c) => sum + c.weight, 0) === 100
            ? "complete"
            : "incomplete",
        }
      : cat
  )
);

  };

  const updateCondition = (
    conditionId: string,
    field: keyof RiskCondition,
    value: any
  ) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== activeTab) return cat;

        const newConditions = cat.conditions.map((c) => {
          if (c.id === conditionId) {
            if (field === "weight") {
              // Calculate total weight if we apply this new weight
              const otherWeights = cat.conditions
                .filter((cond) => cond.id !== conditionId)
                .reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
              const newWeight = Math.min(Number(value), 100 - otherWeights); // cap at remaining %
              return { ...c, [field]: newWeight };
            }
            return { ...c, [field]: value };
          }
          return c;
        });

        const totalWeight = newConditions.reduce(
          (sum, c) => sum + (Number(c.weight) || 0),
          0
        );

      return {
  ...cat,
  conditions: newConditions,
  totalWeight,
  status: totalWeight === 100 ? "complete" : "incomplete", // <-- dynamic status
};

      })
    );
  };

  const saveRules = () => {
    // Check if total weights equal 100% for categories with conditions
    const categoriesWithConditions = categories.filter(cat => cat.conditions.length > 0);
    const incompleteCategories = categoriesWithConditions.filter(cat => cat.totalWeight !== 100);
    
    if (incompleteCategories.length > 0) {
      toast({
        title: "Invalid Configuration",
        description: "All categories with conditions must have weights totaling 100%",
        variant: "destructive"
      });
      return;
    }

    saveConfigurations();
  };

  const previewRules = () => {
    toast({
      title: "Rules Preview",
      description: "Opening rules preview...",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Scoring Configuration
        </h1>
        <p className="text-muted-foreground">
          Configure scoring rules and conditions for risk assessment
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === category.id
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Active Category Content */}
      {activeCategory && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{activeCategory.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Define conditions and weights for this category
              </p>
            </div>
            <Badge
              variant={
                activeCategory.totalWeight === 100 ? "default" : "destructive"
              }
            >
              Total: {activeCategory.totalWeight}%
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCategory.conditions.map((condition) => (
              <div
                key={condition.id}
                className="flex items-end gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <Label>Field</Label>
                  <Select
                    value={condition.field}
                    onValueChange={(value) => {
                      const selectedField = fieldOptions[
                        activeTab as keyof typeof fieldOptions
                      ]?.find((f) => f.name === value);
                      updateCondition(condition.id, "field", value);
                      if (selectedField) {
                        updateCondition(
                          condition.id,
                          "dataType",
                          selectedField.dataType
                        );
                        updateCondition(
                          condition.id,
                          "riskFieldId",
                          selectedField.riskFieldId
                        );
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions[
                        activeTab as keyof typeof fieldOptions
                      ]?.map((field) => {
                        // Find if this field is used in another condition (not this one)
                        const isUsed = activeCategory.conditions.some(
                          (c) => c.field === field.name && c.id !== condition.id
                        );
                        return (
                          <SelectItem
                            key={field.name}
                            value={field.name}
                            disabled={isUsed}
                          >
                            {field.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
   <div className="w-24">
  <Label>Operator</Label>
  <Select
    value={activeTab === "identity" ? "=" : condition.operator}
    onValueChange={(value) =>
      updateCondition(condition.id, "operator", value)
    }
    disabled={activeTab === "identity"} // Cannot change for Identity
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {activeTab === "identity" ? (
        <SelectItem value="=">=</SelectItem>
      ) : (
        getOperatorsForDataType(condition.dataType).map((op) => (
          <SelectItem key={op.value} value={op.value}>
            {op.label}
          </SelectItem>
        ))
      )}
    </SelectContent>
  </Select>
</div>

<div className="w-32">
  <Label>Value</Label>
  {activeTab === "identity" ? (
    <Select
      value={condition.value}
      onValueChange={(value) => updateCondition(condition.id, "value", value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Yes">Yes</SelectItem>
        <SelectItem value="No">No</SelectItem>
      </SelectContent>
    </Select>
  ) : (
    getValueInput(condition, (value) =>
      updateCondition(condition.id, "value", value)
    )
  )}
</div>


                <div className="w-20">
                  <Label>Weight %</Label>
                  <Input
                    type="number"
                    value={condition.weight}
                    onChange={(e) =>
                      updateCondition(
                        condition.id,
                        "weight",
                        Number(e.target.value)
                      )
                    }
                    placeholder="40"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(condition.id)}
                  className="text-destructive hover:text-destructive h-10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" onClick={addCondition} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Condition
            </Button>

            <div className="text-sm text-muted-foreground">
              {activeCategory.conditions.length} conditions configured
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Overview of all configured scoring rules
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="text-center p-4 border rounded-lg"
              >
                <h3 className="font-medium text-sm">{category.name}</h3>
                <div className="text-2xl font-bold mt-2">
                  {category.conditions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Weight: {category.totalWeight}%
                </p>
                <Badge
                  variant={
                    category.status === "complete" ? "default" : "secondary"
                  }
                  className="mt-2"
                >
                  {category.status === "complete" ? "Complete" : "Incomplete"}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-6">
            <Button onClick={previewRules} variant="outline">
              Preview Rules
            </Button>
            <Button onClick={saveRules} disabled={loading}>
              {loading ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskConfiguration;
