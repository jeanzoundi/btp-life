#include "BtpLifeApiSubsystem.h"
#include "HttpModule.h"

void UBtpLifeApiSubsystem::GetPublicCatalog(const FString& Resource)
{
    const FString BaseUrl = TEXT("https://btp-life-backend.vercel.app/api");
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(FString::Printf(TEXT("%s/catalog/%s"), *BaseUrl, *Resource));
    Request->SetVerb(TEXT("GET"));
    Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
    if (!AccessToken.IsEmpty()) Request->SetHeader(TEXT("Authorization"), TEXT("Bearer ") + AccessToken);
    Request->OnProcessRequestComplete().BindUObject(this, &UBtpLifeApiSubsystem::HandleResponse);
    Request->ProcessRequest();
}

void UBtpLifeApiSubsystem::HandleResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bConnectedSuccessfully)
{
    const bool bOk = bConnectedSuccessfully && Response.IsValid() && EHttpResponseCodes::IsOk(Response->GetResponseCode());
    OnResponse.Broadcast(bOk, Response.IsValid() ? Response->GetContentAsString() : TEXT(""));
}
