#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "BtpLifeCharacter.generated.h"

class USpringArmComponent;
class UCameraComponent;
class UStaticMeshComponent;

UCLASS()
class BTPLIFE_API ABtpLifeCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ABtpLifeCharacter();
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

private:
    void MoveForward(float Value);
    void MoveRight(float Value);
    void Interact();

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<USpringArmComponent> CameraBoom;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UCameraComponent> FollowCamera;

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> VisualBody;
};
