#include "BtpLifeDistrictGenerator.h"
#include "BtpLifeBuilding.h"
#include "BtpLifeNpcCharacter.h"
#include "Components/StaticMeshComponent.h"
#include "Engine/StaticMeshActor.h"
#include "UObject/ConstructorHelpers.h"

ABtpLifeDistrictGenerator::ABtpLifeDistrictGenerator()
{
    PrimaryActorTick.bCanEverTick = false;
}

void ABtpLifeDistrictGenerator::BeginPlay()
{
    Super::BeginPlay();
    SpawnGround();

    SpawnBuilding(TEXT("Universite BTP"), TEXT("/api/catalog/cours"), FVector(-1700, -1400, 250), FVector(1000, 800, 500), FLinearColor(0.72f, 0.55f, 0.31f));
    SpawnBuilding(TEXT("Entreprise BTP"), TEXT("/api/carriere/entreprise"), FVector(1600, -1400, 500), FVector(800, 700, 1000), FLinearColor(0.22f, 0.31f, 0.43f));
    SpawnBuilding(TEXT("Chantier"), TEXT("/api/chantiers"), FVector(1700, 1300, 180), FVector(1200, 900, 360), FLinearColor(0.88f, 0.42f, 0.04f));
    SpawnBuilding(TEXT("Residence"), TEXT("/api/carriere/me"), FVector(-1700, 1300, 220), FVector(850, 700, 440), FLinearColor(0.64f, 0.26f, 0.08f));
    SpawnBuilding(TEXT("Maquis"), TEXT("/api/carriere/besoins/repas"), FVector(-650, 1900, 170), FVector(620, 500, 340), FLinearColor(0.62f, 0.15f, 0.09f));
    SpawnBuilding(TEXT("Banque BTL"), TEXT("/api/carriere/epargne"), FVector(-2450, 0, 260), FVector(700, 600, 520), FLinearColor(0.68f, 0.57f, 0.25f));

    const TArray<FVector> RouteA = { FVector(-500, -500, 100), FVector(700, -500, 100), FVector(700, 700, 100), FVector(-500, 700, 100) };
    SpawnNpc(TEXT("Akissi - Professeure"), FVector(-500, -500, 100), RouteA);
    SpawnNpc(TEXT("Koffi - Chef de chantier"), FVector(500, 700, 100), RouteA);
    SpawnNpc(TEXT("Awa - Voisine"), FVector(-500, 700, 100), RouteA);
}

void ABtpLifeDistrictGenerator::SpawnGround()
{
    UStaticMesh* Cube = LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube.Cube"));
    auto SpawnBlock = [&](const FVector& Location, const FVector& Scale, const TCHAR* Name)
    {
        AStaticMeshActor* Block = GetWorld()->SpawnActor<AStaticMeshActor>(Location, FRotator::ZeroRotator);
        Block->GetStaticMeshComponent()->SetStaticMesh(Cube);
        Block->GetStaticMeshComponent()->SetWorldScale3D(Scale);
        Block->GetStaticMeshComponent()->SetMobility(EComponentMobility::Static);
    };
    SpawnBlock(FVector(0, 0, -60), FVector(70, 60, 1), TEXT("Ground"));
    SpawnBlock(FVector(0, 0, 0), FVector(8, 60, 0.12f), TEXT("NorthSouthRoad"));
    SpawnBlock(FVector(0, 0, 5), FVector(70, 8, 0.12f), TEXT("EastWestRoad"));
}

void ABtpLifeDistrictGenerator::SpawnBuilding(const FString& Name, const FString& Destination, const FVector& Location, const FVector& Size, const FLinearColor& Color)
{
    ABtpLifeBuilding* Building = GetWorld()->SpawnActor<ABtpLifeBuilding>(Location, FRotator::ZeroRotator);
    Building->Configure(Name, Destination, Size, Color);
}

void ABtpLifeDistrictGenerator::SpawnNpc(const FString& Name, const FVector& Location, const TArray<FVector>& Route)
{
    ABtpLifeNpcCharacter* Npc = GetWorld()->SpawnActor<ABtpLifeNpcCharacter>(Location, FRotator::ZeroRotator);
    Npc->InitializeRoute(Route, Name);
}
