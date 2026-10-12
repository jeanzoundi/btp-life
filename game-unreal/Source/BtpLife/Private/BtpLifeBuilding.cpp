#include "BtpLifeBuilding.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "Components/SceneComponent.h"
#include "Engine/Engine.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "UObject/ConstructorHelpers.h"

ABtpLifeBuilding::ABtpLifeBuilding()
{
    PrimaryActorTick.bCanEverTick = false;

    SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
    RootComponent = SceneRoot;
    BuildingMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("BuildingMesh"));
    BuildingMesh->SetupAttachment(SceneRoot);
    BuildingMesh->SetCollisionProfileName(TEXT("BlockAll"));

    static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
    if (Cube.Succeeded()) BuildingMesh->SetStaticMesh(Cube.Object);

    Label = CreateDefaultSubobject<UTextRenderComponent>(TEXT("Label"));
    Label->SetupAttachment(SceneRoot);
    Label->SetHorizontalAlignment(EHTA_Center);
    Label->SetWorldSize(55.f);
    Label->SetTextRenderColor(FColor::White);
    Label->SetRelativeRotation(FRotator(0.f, 180.f, 0.f));
}

void ABtpLifeBuilding::Configure(const FString& InName, const FString& InDestination, const FVector& InSize, const FLinearColor& InColor)
{
    DisplayName = InName;
    Destination = InDestination;
    BuildingMesh->SetRelativeScale3D(InSize / 100.f);
    if (UMaterialInterface* BaseMaterial = LoadObject<UMaterialInterface>(nullptr, TEXT("/Engine/BasicShapes/BasicShapeMaterial.BasicShapeMaterial")))
    {
        UMaterialInstanceDynamic* Material = UMaterialInstanceDynamic::Create(BaseMaterial, this);
        Material->SetVectorParameterValue(TEXT("Color"), InColor);
        BuildingMesh->SetMaterial(0, Material);
    }
    Label->SetText(FText::FromString(InName));
    Label->SetRelativeLocation(FVector(0.f, 0.f, InSize.Z * 0.5f + 100.f));
}

void ABtpLifeBuilding::Interact(APlayerController* Controller)
{
    if (GEngine)
    {
        GEngine->AddOnScreenDebugMessage(-1, 5.f, FColor::Yellow,
            FString::Printf(TEXT("Entrer : %s | destination backend : %s"), *DisplayName, *Destination));
    }
}
