package com.deepfakemobile;

import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.linphone.core.Account;
import org.linphone.core.AccountParams;
import org.linphone.core.Address;
import org.linphone.core.AuthInfo;
import org.linphone.core.Call;
import org.linphone.core.CallParams;
import org.linphone.core.Core;
import org.linphone.core.CoreListenerStub;
import org.linphone.core.Factory;
import org.linphone.core.RegistrationState;
import org.linphone.core.TransportType;

public class LinphoneService extends ReactContextBaseJavaModule {

    private Core linphoneCore;
    private CoreListenerStub coreListener;
    private Handler handler;
    private Call call;
    private final ReactApplicationContext reactContext;

    public LinphoneService(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        Factory.instance().setLogCollectionPath(reactContext.getFilesDir().getAbsolutePath());
        linphoneCore = Factory.instance().createCore(null, null, reactContext);

        // coreListener = new CoreListenerStub() {
        //     @Override
        //     public void callState(@NonNull Core core, @NonNull Call call,@NonNull State state, @NonNull String message) {
        //         LinphoneService.this.call = call;
        //         LinphoneService.this.state = state;
        //         if(state == LinphoneCall.State.IncomingReceived) {
        //             sendEvent("IncomingCall", message);
        //         }
                
        //     }

        //     @Override
        //     public void registrationState(@NonNull Core core, @NonNull org.linphone.core.ProxyConfig config, @NonNull RegistrationState state, @NonNull String message) {
        //         sendEvent("RegistrationStateChanged", state.toString() + ": " + message);
        //     }

        // };

        // linphoneCore.addListener(coreListener);

        handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                linphoneCore.iterate();
                handler.postDelayed(this, 20);
            }
        }, 20);
    }

    @NonNull
    @Override
    public String getName() {
        return "LinphoneService";
    }

    private void sendEvent(String eventName, String message) {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, message);
    }

    @ReactMethod
    public void register(String username, String password, String domain) {
        String identity = "sip:" + username + "@" + domain;
        Address identityAddress = linphoneCore.createAddress(identity);
        Address serverAddress = linphoneCore.createAddress("sip:" + domain);

        AccountParams accountParams = linphoneCore.createAccountParams();
        accountParams.setIdentityAddress(identityAddress);
        accountParams.setServerAddress(serverAddress);
        accountParams.setRegisterEnabled(true);
        accountParams.setTransport(TransportType.Udp);

        AuthInfo authInfo = Factory.instance().createAuthInfo(username, null, password, null, null, domain);
        linphoneCore.addAuthInfo(authInfo);

        Account account = linphoneCore.createAccount(accountParams);
        linphoneCore.addAccount(account);
        linphoneCore.setDefaultAccount(account);
    }

    @ReactMethod
    public void acceptCall() {
        if (call != null) {
            CallParams callParams = linphoneCore.createCallParams(call);
            call.acceptWithParams(callParams);
        }
    }

    @ReactMethod
    public void declineCall() {
        if (call != null) {
            call.terminate();
        }
    }

    @ReactMethod
    public void testNativeModule() {
        sendEvent("TestNativeModule", "Native module is working!");
    }
}
