#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "BtpLifeNpcCharacter.generated.h"

class UStaticMeshComponent;

UCLASS()
class BTPLIFE_API ABtpLifeNpcCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ABtpLifeNpcCharacter();
    virtual void Tick(float DeltaSeconds) override;
    void InitializeRoute(const TArray<FVector>& InRoute, const FString& InName);

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> VisualBody;

private:
    TArray<FVector> Route;
    int32 RouteIndex = 0;
    FString NpcName;
};

