    // Import the functions you need from the SDKs you need
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import { getDatabase, ref, get, push, set, update, onChildAdded, remove, onChildRemoved, onChildChanged, onValue } 
        from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
    import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } 
        from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


    // TODO: Add SDKs for Firebase products that you want to use
    // https://firebase.google.com/docs/web/setup#available-libraries
  
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    };
  
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    //Firebase-RealtimeDatabase接続
    const db  = getDatabase(app); //RealtimeDBに接続
    const dbRef = ref(db,"chat"); //RealtimeDBのchatにデータを格納
    const dbMemRef = ref(db,"member");
    const dbCountRef = ref(db,"count");

    //GoogleAuth用
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    const auth = getAuth();

    //Loginしていれば処理します
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/firebase.User
            // const uid = user.uid;
            //ユーザー情報取得できます
            if (user !== null) {
                user.providerData.forEach((profile) => {
                    //Login情報取得
                    $("#uname").text(profile.displayName);
                    $("#prof").attr("src",profile.photoURL);
                    // console.log("Sign-in provider: " + profile.providerId);
                    // console.log("Provider-specific UID: " + profile.uid);
                    // console.log("Email: " + profile.email);
                    // console.log("Photo URL: " + profile.photoURL);
                });
            }

            //操作をここに入力
            //メンバー追加
            let memNumber = 1;
            $("#memSend").on("click",function(){
                const member = {
                    memName : $("#member").val()
                }
                const newMemRef = push(dbMemRef); //ユニークKEYというメッセージごとの番号を生成
                set(newMemRef,member);
            });

            //最初にメンバーデータ取得＆onSnapshotでリアルタイムにデータを取得
            let isInitialLoad = true;

            onChildAdded(dbMemRef, async function(data) {
                const member = data.val();
                const key = data.key; // ユニークキーを取得
                
                let h = '<p class="'+key+'">';
                    h += member.memName;
                    h += '<span class="memRemove" data-key="'+key+'" style="margin-left:10px;"><a class="afterbtn">🗑</a></span>';
                    h += "</p>";
                $("#memOutput").append(h);
              
                // 初回ロード時は `incrementCount` を実行しない
                if (!isInitialLoad) {
                  await incrementCount();
                }
              
                const nowCountVal = await getCount();
              
                let i = '<option value="'+nowCountVal+'" class="'+key+'">';
                    i += member.memName;
                    i += '</option>';
                $("#name").append(i);
              });
              
              // 全ての初回ロードが完了したらフラグをオフにする
              onValue(dbMemRef, () => {
                isInitialLoad = false;
              }, { onlyOnce: true });


            async function getCount(){
                const snapshot = await get(dbCountRef);
                const nowCountVal = snapshot.val();
                return nowCountVal;
            };


            //カウントを増やす関数
            function incrementCount() {
                // 現在のカウント値を読み取り、+1して保存
                onValue(dbCountRef, (snapshot) => {
                    let count = snapshot.val() || 0; // 値が存在しない場合は0を初期値に
                    set(dbCountRef, count + 1); // 更新
                }, {
                    onlyOnce: true // データの読み取りは1回のみ
                });
            };

            //カウントを減らす関数
            function decrementCount() {
                // 現在のカウント値を読み取り、-1して保存
                onValue(dbCountRef, (snapshot) => {
                    let count = snapshot.val() || 1; // 値が存在しない場合は0を初期値に
                    set(dbCountRef, count - 1); // 更新
                }, {
                    onlyOnce: true // データの読み取りは1回のみ
                });
            }

            //削除イベント
            $("#memOutput").on("click",".memRemove",function(){
                const key = $(this).attr("data-key");
                const remove_item = ref(db,"member/"+key);
                remove(remove_item);//Firebaseから削除
                decrementCount();
            });

            //画面からも削除されたメンバーを消す
            onChildRemoved(dbMemRef, (data) => {
                $("."+data.key).remove(); //DOM操作関数（対象を削除）
            });
            

            //データ送信
            $("#send").on("click",async function(){
                const msg = {
                    name : $("#name").find("option:selected").text(),
                    text : $("#text").val()
                }
                const dbEachRef = await ref(db,"chat/"+$("#name").val() ); //RealtimeDBのchatにデータを格納
                const newPostRef = push(dbEachRef); //ユニークKEYというメッセージごとの番号を生成
                set(newPostRef,msg);
            });

            //最初にデータ取得＆onSnapshotでリアルタイムにデータを取得
            onChildAdded(ref(db,"chat/null"),function(data){
                const msg = data.val();
                const key = data.key; //ユニークKEY取得
                let h = '<p id="'+key+'">';
                    h += msg.name;
                    h += "が";
                    h += '<span contentEditable="true" id="'+key+'_update">'+msg.text+'</span>';
                    h += "円の支払い";
                    h += '<span class="remove" data-key="'+key+'" style="margin-left:50px;"><a class="afterbtn">削除</a></span>';
                    // h += '<span class="update" data-key="'+key+'" style="margin-left:20px;"><a class="afterbtn">更新</a></span>';
                    h += "</p>";
                $("#output").append(h);
            });
            onChildAdded(ref(db,"chat/2"),function(data){
                const msg = data.val();
                const key = data.key; //ユニークKEY取得
                let h = '<p id="'+key+'">';
                    h += msg.name;
                    h += "が";
                    h += '<span contentEditable="true" id="'+key+'_update">'+msg.text+'</span>';
                    h += "円の支払い";
                    h += '<span class="remove" data-key="'+key+'" style="margin-left:50px;"><a class="afterbtn">削除</a></span>';
                    // h += '<span class="update" data-key="'+key+'" style="margin-left:20px;"><a class="afterbtn">更新</a></span>';
                    h += "</p>";
                $("#output").append(h);
            });

            //削除イベント
            $("#output").on("click",".remove",function(){
                const key = $(this).attr("data-key");
                const remove_item = ref(db,"chat/null/"+key);
                remove(remove_item);//Firebaseから削除
                const remove_item2 = ref(db,"chat/2/"+key);
                remove(remove_item2);//Firebaseから削除
            });

            //削除処理がFirebase側で実行されたらイベント発生！
            onChildRemoved(ref(db,"chat/null"), (data) => {
                $("#"+data.key).remove(); //DOM操作関数（対象を削除）
            });
            onChildRemoved(ref(db,"chat/2"), (data) => {
                $("#"+data.key).remove(); //DOM操作関数（対象を削除）
            });

            //パリピタボタン
            $("#kekka_btn").on("click",async function(){
                const nullSum = await sumAllNulls();
                const oneSum = await sumAllOnes();
                if(nullSum > oneSum){
                    let morau = await getNullName();
                    let ageru = await getOneName();
                    let ikura = (nullSum + OneSum)/2 - OneSum;
                    console.log("もらう人:"+morau);
                    console.log("あげる人:"+ageru);
                    console.log("いくら:"+ikura);
                    $("#kekka_text").html(ageru);
                    $("#kekka_text").append("が");
                    $("#kekka_text").append(morau);
                    $("#kekka_text").append("に");
                    $("#kekka_text").append(ikura);
                    $("#kekka_text").append("円渡してね！"); 
                }else if(oneSum > nullSum){
                    let morau = await getOneName();
                    let ageru = await getNullName();
                    let ikura = (oneSum + nullSum)/2 - nullSum;
                    console.log("もらう人:"+morau);
                    console.log("あげる人:"+ageru);
                    console.log("いくら:"+ikura);
                    $("#kekka_text").html(ageru);
                    $("#kekka_text").append("が");
                    $("#kekka_text").append(morau);
                    $("#kekka_text").append("に");
                    $("#kekka_text").append(ikura);
                    $("#kekka_text").append("円渡してね！");   
                }else if(oneSum == nullSum){
                    $("#kekka_text").append("すでにパリピタになっているよ！おめでとう！");
                }
            });

            async function getNullName() {
                const messagesRef = ref(db, 'chat/null'); // 階層を指定
                
                try {
                  const snapshot = await get(messagesRef); // データを取得
              
                  if (snapshot.exists()) {
                    const firstChild = snapshot.val(); // すべてのデータを取得
                    const keys = Object.keys(firstChild); // すべてのキーを取得
                    const firstKey = keys[0]; // 最初のユニークキーを取得
                    const firstMessage = firstChild[firstKey]; // 最初のメッセージのデータを取得
                    
                    console.log(`キー: ${firstKey}, メッセージ: ${firstMessage.name}`);
                    return firstMessage.name;
                  } else {
                    console.log("データが存在しません");
                  }
                } catch (error) {
                  console.error("エラー:", error);
                }
              };
            async function getOneName() {
                const messagesRef = ref(db, 'chat/2'); // 階層を指定
                
                try {
                  const snapshot = await get(messagesRef); // データを取得
              
                  if (snapshot.exists()) {
                    const firstChild = snapshot.val(); // すべてのデータを取得
                    const keys = Object.keys(firstChild); // すべてのキーを取得
                    const firstKey = keys[0]; // 最初のユニークキーを取得
                    const firstMessage = firstChild[firstKey]; // 最初のメッセージのデータを取得
                    
                    console.log(`キー: ${firstKey}, メッセージ: ${firstMessage.name}`);
                    return firstMessage.name;
                  } else {
                    console.log("データが存在しません");
                  }
                } catch (error) {
                  console.error("エラー:", error);
                }
              };

            async function sumAllNulls() {
                const dataRef = ref(db, 'chat/null'); // 対象の階層を指定
                const snapshot = await get(dataRef);        // データを取得
                let totalSum = 0;                           // 合計を初期化
              
                if (snapshot.exists()) {
                  snapshot.forEach((childSnapshot) => {
                    const amount = Number(childSnapshot.val().text); // 'amount' の値を取得
                    console.log(amount);
                    totalSum += amount;                      // 合計に追加
                  });
                  console.log("合計:", totalSum);   
                  return totalSum;           // 合計を表示
                } else {
                  console.log("データが存在しません");
                }
              }
            async function sumAllOnes() {
                const dataRef = ref(db, 'chat/2'); // 対象の階層を指定
                const snapshot = await get(dataRef);        // データを取得
                let totalSum = 0;                           // 合計を初期化
              
                if (snapshot.exists()) {
                  snapshot.forEach((childSnapshot) => {
                    const amount = Number(childSnapshot.val().text); // 'amount' の値を取得
                    console.log(amount);
                    totalSum += amount;                      // 合計に追加
                  });
                  console.log("合計:", totalSum);  
                  return totalSum;             // 合計を表示
                } else {
                  console.log("データが存在しません");
                }
              }

            // //更新イベント
            // $("#output").on("click",".update",function(){
            //     const key = $(this).attr("data-key");
            //     const update_item = ref(db,"chat/"+$("#name").val()+"/"+key);
            //     update(update_item,{
            //         text: $("#"+key+'_update').html()
            //     });
            // });

            // //更新処理がFirebase側で実行されたらイベント発生！
            // onChildChanged(ref(db,"chat/null"),(data) => {
            //     $("#"+data.key+"_update").html(data.val().text);
            //     $("#"+data.key+"_update").fadeOut(800).fadeIn(800);
            // });
            // onChildChanged(ref(db,"chat/1"),(data) => {
            //     $("#"+data.key+"_update").html(data.val().text);
            //     $("#"+data.key+"_update").fadeOut(800).fadeIn(800);
            // });

        } else {
            _redirect();  // User is signed out
        }
    });

    //###############################################
    //Login画面へリダイレクト(関数作成)
    //###############################################
    function _redirect(){
        location.href="login.html";
    }

    //###############################################
    //Logout処理
    //###############################################
    $("#out").on("click", function () {
        // signInWithRedirect(auth, provider);
        signOut(auth).then(() => {
            // Sign-out successful.
            _redirect();
        }).catch((error) => {
            // An error happened.
            console.error(error);
        });
    });
