#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "BtpLifeGameMode.generated.h"

UCLASS()
class BTPLIFE_API ABtpLifeGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    ABtpLifeGameMode();
    virtual void BeginPlay() override;
};
