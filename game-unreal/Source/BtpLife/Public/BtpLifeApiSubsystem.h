#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "BtpLifeApiSubsystem.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FBtpApiResponse, bool, bSuccess, const FString&, JsonBody);

UCLASS()
class BTPLIFE_API UBtpLifeApiSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    UPROPERTY(BlueprintAssignable)
    FBtpApiResponse OnResponse;

    UFUNCTION(BlueprintCallable)
    void GetPublicCatalog(const FString& Resource);

    UFUNCTION(BlueprintCallable)
    void SetAccessToken(const FString& Token) { AccessToken = Token; }

private:
    FString AccessToken;
    void HandleResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bConnectedSuccessfully);
};
