#include "BtpLifeGameMode.h"
#include "BtpLifeCharacter.h"
#include "BtpLifeDistrictGenerator.h"
#include "GameFramework/PlayerController.h"

ABtpLifeGameMode::ABtpLifeGameMode()
{
    DefaultPawnClass = ABtpLifeCharacter::StaticClass();
}

void ABtpLifeGameMode::BeginPlay()
{
    Super::BeginPlay();
    GetWorld()->SpawnActor<ABtpLifeDistrictGenerator>(FVector::ZeroVector, FRotator::ZeroRotator);
    APlayerController* PlayerController = GetWorld()->GetFirstPlayerController();
    if (PlayerController && !PlayerController->GetPawn())
    {
        ABtpLifeCharacter* Character = GetWorld()->SpawnActor<ABtpLifeCharacter>(FVector(0.f, 0.f, 120.f), FRotator::ZeroRotator);
        PlayerController->Possess(Character);
    }
}
