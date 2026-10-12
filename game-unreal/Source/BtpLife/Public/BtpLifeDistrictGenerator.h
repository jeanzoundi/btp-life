#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BtpLifeDistrictGenerator.generated.h"

UCLASS()
class BTPLIFE_API ABtpLifeDistrictGenerator : public AActor
{
    GENERATED_BODY()

public:
    ABtpLifeDistrictGenerator();
    virtual void BeginPlay() override;

private:
    void SpawnGround();
    void SpawnBuilding(const FString& Name, const FString& Destination, const FVector& Location, const FVector& Size, const FLinearColor& Color);
    void SpawnNpc(const FString& Name, const FVector& Location, const TArray<FVector>& Route);
};
