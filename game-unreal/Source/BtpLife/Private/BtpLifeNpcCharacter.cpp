#include "BtpLifeNpcCharacter.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "UObject/ConstructorHelpers.h"

ABtpLifeNpcCharacter::ABtpLifeNpcCharacter()
{
    PrimaryActorTick.bCanEverTick = true;
    GetCharacterMovement()->MaxWalkSpeed = 180.f;
    GetCharacterMovement()->bOrientRotationToMovement = true;
    VisualBody = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("VisualBody"));
    VisualBody->SetupAttachment(RootComponent);
    VisualBody->SetRelativeScale3D(FVector(0.45f, 0.45f, 1.25f));
    VisualBody->SetRelativeLocation(FVector(0.f, 0.f, -15.f));
    VisualBody->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    static ConstructorHelpers::FObjectFinder<UStaticMesh> BodyMesh(TEXT("/Engine/BasicShapes/Cylinder.Cylinder"));
    if (BodyMesh.Succeeded()) VisualBody->SetStaticMesh(BodyMesh.Object);
}

void ABtpLifeNpcCharacter::InitializeRoute(const TArray<FVector>& InRoute, const FString& InName)
{
    Route = InRoute;
    NpcName = InName;
}

void ABtpLifeNpcCharacter::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    if (Route.IsEmpty()) return;
    const FVector Delta = Route[RouteIndex] - GetActorLocation();
    if (Delta.SizeSquared2D() < FMath::Square(100.f))
    {
        RouteIndex = (RouteIndex + 1) % Route.Num();
        return;
    }
    AddMovementInput(Delta.GetSafeNormal2D(), 0.55f);
}
