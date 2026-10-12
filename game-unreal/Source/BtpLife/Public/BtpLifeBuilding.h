#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BtpLifeBuilding.generated.h"

class UStaticMeshComponent;
class UTextRenderComponent;
class USceneComponent;

UCLASS()
class BTPLIFE_API ABtpLifeBuilding : public AActor
{
    GENERATED_BODY()

public:
    ABtpLifeBuilding();

    void Configure(const FString& InName, const FString& InDestination, const FVector& InSize, const FLinearColor& InColor);
    void Interact(APlayerController* Controller);

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<USceneComponent> SceneRoot;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<UStaticMeshComponent> BuildingMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    TObjectPtr<UTextRenderComponent> Label;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    FString DisplayName;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    FString Destination;
};

