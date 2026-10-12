using UnrealBuildTool;

public class BtpLife : ModuleRules
{
    public BtpLife(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
        PublicDependencyModuleNames.AddRange(new[] {
            "Core", "CoreUObject", "Engine", "InputCore", "HTTP", "Json", "JsonUtilities",
            "UMG", "Slate", "SlateCore"
        });
    }
}
