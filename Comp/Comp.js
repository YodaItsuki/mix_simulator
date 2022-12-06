class seigyo{ //audiocontextとボリュームのノードとエフェクターのノードのクラス
  constructor(audioCtx,gainNode,effectnode,analyserNode_before,analyserNode_after,Pannode,preset_temp,preset_name){
    this.audioCtx = audioCtx;
    this.gainNode = gainNode;
    this.effectnode = effectnode;
    this.Pannode = Pannode;
    this.analyserNode_before = analyserNode_before;
    this.analyserNode_after = analyserNode_after;
    this.name = preset_name;
    if(preset_temp != undefined){
      this.effect_temp = preset_temp; //EQのgainの値を保存する変数 エフェクトオンオフの時に使う
    }
    else{
      this.effect_temp = [0,2,0.003,0.25];
    }
  }

  touroku(element,sentaku){
    this.audio = element.querySelector('#audio');
    this.audio.onloadedmetadata = function() {
      this.timeset(element.querySelector('#audio').duration);
    }.bind(this);
    this.filesousin = element.querySelector('#filesousin');
    this.kirikae = element.querySelector('#kirikae');
    this.effect_switch = element.querySelector('#effect_switch');
    this.mute_button = element.querySelector('#mute');
    this.solo_button = element.querySelector('#solo');
    this.reset_button = element.querySelector('#reset');
    this.audio_name = element.querySelector('#audio_name');
    this.select_mark = element.querySelector('#select_mark'); //現在選択している音源のマークの表示
    this.select_mark.style.color = "red";
    this.volume_temp = 1; //ボリュームの値の一時保存の変数　ミュートとソロの時に使う
    this.effect_switch_flag = false;
    this.mute_flag = false; //ミュートの判定のフラグ
    this.solo_flag = false; //ソロの判定のフラグ
    this.filesousin.addEventListener( 'change', () => { //ファイルを選択した時の動作
      this.reader = new FileReader();
      this.file = this.filesousin.files[0];
      this.url;
      this.name = this.filesousin.files[0].name; //ファイル名を取得
      this.reader.onload = () => {
        this.url = this.reader.result;
        this.sousin(this.url);
      };
      this.reader.readAsDataURL(this.file);
    } );
    this.kirikae.addEventListener( 'click', () => {this.kirikaeru()} );
    this.effect_switch.addEventListener( 'click', () => {this.switch()} );
    this.mute_button.addEventListener( 'click', () => {this.mute()} );
    this.solo_button.addEventListener( 'click', () => {this.solo()} );
    this.reset_button.addEventListener( 'click', () => {this.reset()} );
    this.sentaku = sentaku; //配列内の何番目のインスタンスなのか
    this.sousakinshi = false; //エフェクターが操作禁止かどうかを判定する変数 falseが操作できる trueが操作不可
    this.sousin();
  }

  timeset(duration){ //再生位置の調整スライダーの値を変える
    if(saiseiichi.max == 0){
      saiseiichi.max = duration;
      for(var i = 0 ; i < audio.length ; i++){
        if(saiseiichi.max == audio[i].duration){
          max_audio = i; //一番再生時間が長い音源が何番目なのかの変数
        }
      }
    }
    else{
      if(saiseiichi.max < duration){ //もし読み込んだ音源が再生位置のスライダーの最大の値を超えた場合
        saiseiichi.max = duration; //再生位置のスライダーの最大の値変える
      }
      for(var i = 0 ; i < audio.length ; i++){
        if(saiseiichi.max == audio[i].duration){ //すべての音源と比較して読み込んだ音源の時間が一番長いときの動作
          max_audio = i;
        }
      }
    }
  }

  sousin(url) { //ファイルを選択したときの動作 audioタグのsrcに入れて各ノードを接続
    for(var i = 0; i < audio.length; i++){ //一旦すべてのトラックの再生を停止して、再生位置を一番最初に戻す
      audio[i].pause();
      audio[i].currentTime = 0; 
    }
    this.audio_name.textContent = this.name; //選択したファイルの名前を表示
    sentaku_audio.textContent = seigyo_elements[sentaku].name; //選択中のファイルの名前を表示
    douji.value = "再生";
    saisei_flag = false;
    if(url != undefined){
      this.audio.src = url;
    }
    if(this.source == null){
      this.source = this.audioCtx.createMediaElementSource(this.audio); //ノード作成
    }
    //ノードの接続 入力→ボリューム→パン→エフェクター→出力
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.Pannode);
    this.Pannode.connect(this.effectnode);
    this.gainNode.connect(this.analyserNode_before); //エフェクトをかける前のアナライザー
    this.effectnode.connect(this.analyserNode_after); //エフェクトをかけた後のアナライザー
    this.effectnode.connect(this.audioCtx.destination);
    if(douji.disabled == true){ //再生が操作不可の時の動作
      douji.disabled = false; //再生をボタンを押せるようにする
      saiseiichi.disabled = false; //再生位置を調整できるようにする
    }
  }

  switch(){ //Bypassを押したときの動作
    if(this.effect_switch_flag == false){ //エフェクトオフ・オンのボタンがエフェクトオフの時
      this.effectnode.threshold.value = 0;
      if(this.sentaku == sentaku){ //エフェクトを適応する音源を選択して、その選択中の音源のエフェクトをオンオフするときだけ変更する
        effect_set.threshold.disabled = true; //スライダーを操作不能にする
        effect_set.ratio.disabled = true;
        effect_set.attack.disabled = true;
        effect_set.release.disabled = true;
      }
      this.sousakinshi = true; //エフェクターが操作できるかどうかのフラグをtrueにする
      this.effect_switch.style.backgroundColor = "red";
      this.effect_switch.style.color = "white";
      this.effect_switch_flag = true;
    }
    else if(this.effect_switch_flag == true){ //エフェクトオフ・オンのボタンがエフェクトオンの時
      this.effectnode.threshold.value = this.effect_temp[0];
      if(this.sentaku == sentaku){
        effect_set.threshold.disabled = false; //スライダーを操作できるようにする
        effect_set.ratio.disabled = false;
        effect_set.attack.disabled = false;
        effect_set.release.disabled = false;
      }
      this.effect_switch.style.backgroundColor = "#F0F0F0";
      this.effect_switch.style.color = "black";
      this.sousakinshi = false; //エフェクターが操作できるかどうかのフラグをfalseにする
      this.effect_switch_flag = false;
    }
  }

  kirikaeru() { //切り替えを押したときの動作
    seigyo_elements[sentaku].select_mark.textContent = "";
    sentaku = this.sentaku; //どれを操作しているかをこのインスタンスの配列の番号にする
    //各エフェクターの値をその音源の値にする
    this.select_mark.textContent = "●";
    sentaku_audio.textContent = this.name;
    volume.value = this.volume_temp;
    volumedb.textContent = Math.round(volume.value * 100);
    pan.value = this.Pannode.pan.value;
    if(pan.value == 0){
      direction.textContent = "C";
    }
    else if(pan.value < 0){
      direction.textContent = "L" + Math.round(Math.abs(pan.value) * 100);
    }
    else{
      direction.textContent = "R" + Math.round(pan.value * 100);
    }
    effect_set.threshold.value = this.effect_temp[0];
    effect_set.ratio.value = this.effect_temp[1];
    effect_set.attack.value = this.effect_temp[2];
    effect_set.release.value = this.effect_temp[3];
    effect_set.threshold_view.textContent = this.effect_temp[0];
    effect_set.ratio_view.textContent = this.effect_temp[1];
    effect_set.attack_view.textContent = this.effect_temp[2];
    effect_set.release_view.textContent = this.effect_temp[3];
    if(this.sousakinshi == false){
      effect_set.threshold.disabled = false; //スライダーを操作できるようにする
      effect_set.ratio.disabled = false;
      effect_set.attack.disabled = false;
      effect_set.release.disabled = false;
    }
    else{
      effect_set.threshold.disabled = true; //スライダーを操作不能にする
      effect_set.ratio.disabled = true;
      effect_set.attack.disabled = true;
      effect_set.release.disabled = true;
    }
    if(this.mute_flag == true){ //ミュートかどうかを判定するフラグがtrueの時
      volume.disabled = true; //ボリュームを操作不可にする
      volume.value = this.volume_temp; //一時保存したボリュームの値を表示するようにする
    }
    else{
      volume.disabled = false; //ボリュームを操作できるようにする
    }
    this.graph(); //グラフを書き換える
  }

  mute(){ //ミュートが押されたときの動作
    if(this.mute_flag == false){
      this.gainNode.gain.value = 0; //ボリュームの値を0にする
      if(sentaku == this.sentaku){ //この音源が選択されているとき
        volume.disabled = true;
      }
      this.mute_button.style.backgroundColor = "red";
      this.mute_button.style.color = "white";
      this.mute_flag = true; //ミュートしてるかどうかのフラグをtrueに変える
    }
    else{
      this.gainNode.gain.value = this.volume_temp; //一時保存していたボリュームの値を戻す
      if(sentaku == this.sentaku){ //この音源が選択されているとき
        volume.disabled = false;
      }
      this.mute_button.style.backgroundColor = "#F0F0F0";
      this.mute_button.style.color = "black";
      this.mute_flag = false; //フラグをfalseに変える
    }
  }

  solo(){ //ソロが押されたときの動作
    if(this.solo_flag == false){ //ソロを判定するフラグがfalseの時
      for(var i = 0; i < number_of_seigyo; i++) {
        if(i != this.sentaku){ //iがソロをする音源でないとき
          seigyo_elements[i].gainNode.gain.value = 0; //iの音源のボリュームを0にする
          seigyo_elements[i].mute_button.disabled = true; //iの音源のミュートのボタンを操作不可にする
          seigyo_elements[i].solo_button.disabled = true; //iの音源のソロのボタンを操作不可にする
        }
      }
      this.solo_button.style.backgroundColor = "red";
      this.solo_button.style.color = "white";
      this.solo_flag = true; //ソロを判定するフラグをtrueに変える
    }
    else{
      for(var i = 0; i < number_of_seigyo; i++) {
        if(i != this.sentaku){ //iがソロをする音源でないとき
          if(seigyo_elements[i].mute_flag == true){ //iの音源がミュートになっている場合
            seigyo_elements[i].gainNode.gain.value = 0; //iの音源を0にする
          }
          else{ //iの音源がミュートではない場合
            seigyo_elements[i].gainNode.gain.value = seigyo_elements[i].volume_temp; //一時保存していたボリュームを戻す
          }
          seigyo_elements[i].mute_button.disabled = false; //iの音源のミュートのボタンを操作できるようにする
          seigyo_elements[i].solo_button.disabled = false;//iの音源のソロのボタンを操作できるようにする
        }
      }
      this.solo_button.style.backgroundColor = "#F0F0F0";
      this.solo_button.style.color = "black";
      this.solo_flag = false; //ソロを判定するフラグをfalseにする
    }
  }

  graph(){
    comp_canvas_ctx.clearRect(0, 0, comp_canvas.width, comp_canvas.height);
    comp_canvas_ctx.beginPath();
    comp_canvas_ctx.strokeStyle = 'black';
    comp_canvas_ctx.moveTo(comp_canvas.width - (comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]),(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
    comp_canvas_ctx.lineTo(0,comp_canvas.height);
    comp_canvas_ctx.stroke();
    
    comp_canvas_ctx.beginPath();
    comp_canvas_ctx.strokeStyle = 'black';
    comp_canvas_ctx.moveTo(comp_canvas.width - (comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]),(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
    comp_canvas_ctx.lineTo(comp_canvas.width,((comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0])) - (((comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0])) / seigyo_elements[sentaku].effect_temp[1]));
    comp_canvas_ctx.stroke();
    
    comp_canvas_ctx.beginPath();
    comp_canvas_ctx.strokeStyle = 'orangered';
    comp_canvas_ctx.moveTo(0,(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
    comp_canvas_ctx.lineTo(comp_canvas.width,(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
    comp_canvas_ctx.stroke();
  }

  reset(){
    this.result = confirm("トラックをリセットします。よろしいですか？")
    if( this.result ) {
      //audioのsrcを空にして表示を消す
      this.audio.src = "";
      this.audio_name.textContent = "";
      this.name = "";
      if(sentaku == this.sentaku){
        sentaku_audio.textContent = "";
      }
      for(var i = 0; i < audio.length; i++){
        if(audio[i].src != ""){
          saiseiichi.max = 0; //いったん再生位置のinputの最大値を0にしておく
          for(var i = 0; i < audio.length; i++){
            if(saiseiichi.max < audio[i].duration){
              saiseiichi.max = audio[i].duration;
            }
          }
          for(var i = 0; i < audio.length; i++){
            audio[i].pause();
            audio[i].currentTime = 0;  //いったんすべての音源を停止して再生位置を0に戻す
            if(saiseiichi.max == audio[i].duration){
              max_audio = i;
            }
          }
          saisei_flag = false;
          douji.value = "再生";
          this.effectnode.threshold.value = 0;
          this.effectnode.ratio.value = 2;
          this.effectnode.attack.value = 0.003;
          this.effectnode.release.value = 0.25;
          this.effect_temp[0] = 0;
          this.effect_temp[1] = 2;
          this.effect_temp[2] = 0.003;
          this.effect_temp[3] = 0.25;
          this.gainNode.gain.value = 1;
          this.volume_temp = 1;
          this.Pannode.pan.value = 0;
          if(sentaku == this.sentaku){ //この音源が選択されているとき
            //スライダーと文字をデフォルトに戻す
            effect_set.threshold.value = 0;
            effect_set.ratio.value = 2;
            effect_set.attack.value = 0.003;
            effect_set.release.value = 0.25;
            effect_set.threshold_view.textContent = 0;
            effect_set.ratio_view.textContent = 2;
            effect_set.attack_view.textContent = 0.003;
            effect_set.release_view.textContent = 0.25;
            this.graph();
            volume.value = 1;
            pan.value = 0;
            volumedb.textContent = 100;
            direction.textContent = "C";
          }
          break;
        }
      }
    }
  else {}
  }
}

class effectset{ //エフェクトを操作するクラス
  constructor(){
    this.threshold = document.querySelector('#threshold');
    this.ratio = document.querySelector('#ratio');
    this.attack = document.querySelector('#attack');
    this.release = document.querySelector('#release');
    this.threshold_view = document.querySelector('#threshold_view'); //スレショルドの値の表示
    this.ratio_view = document.querySelector('#ratio_view'); //スレショルドの値の表示
    this.attack_view = document.querySelector('#attack_view'); //スレショルドの値の表示
    this.release_view = document.querySelector('#release_view'); //スレショルドの値の表示
    this.threshold.addEventListener( 'input', () => {this.thresholdset()} ); //スレショルドのスライダーを動かしたときの動作
    this.ratio.addEventListener( 'input', () => {this.ratioset()} );
    this.attack.addEventListener( 'input', () => {this.attackset()} );
    this.release.addEventListener( 'input', () => {this.releaseset()} );
    this.sentaku = 0; //エフェクターを適応する音源の選択、デフォルトで一つ目の音源が選択されている
    this.threshold.value = seigyo_elements[0].effect_temp[0]; //プリセットに書き換える
    this.threshold_view.textContent = seigyo_elements[0].effect_temp[0];
    this.ratio.value = seigyo_elements[0].effect_temp[1];
    this.ratio_view.textContent = seigyo_elements[0].effect_temp[1];
    this.attack.value = seigyo_elements[0].effect_temp[2]; //プリセットに書き換える
    this.attack_view.textContent = seigyo_elements[0].effect_temp[2];
    this.release.value = seigyo_elements[0].effect_temp[3]; //プリセットに書き換える
    this.release_view.textContent = seigyo_elements[0].effect_temp[3];
  }

  thresholdset() {
    seigyo_elements[sentaku].effectnode.threshold.value = this.threshold.value; //コンプのスレショルドを書き換える
    this.threshold_view.textContent = this.threshold.value; //スライダーの数字の表示を変える
    seigyo_elements[sentaku].effect_temp[0] = this.threshold.value; 
    this.threshold_view.textContent = this.threshold.value;
    this.graph();
  }

  ratioset(){
    seigyo_elements[sentaku].effectnode.ratio.value = this.ratio.value; //コンプのスレショルドを書き換える
    this.ratio_view.textContent = this.ratio.value; //スライダーの数字の表示を変える
    seigyo_elements[sentaku].effect_temp[1] = this.ratio.value;
    this.ratio_view.textContent = this.ratio.value;
    this.graph();
  }

  attackset(){
    seigyo_elements[sentaku].effectnode.attack.value = this.attack.value; //コンプのスレショルドを書き換える
    this.attack_view.textContent = this.attack.value; //スライダーの数字の表示を変える
    seigyo_elements[sentaku].effect_temp[2] = this.attack.value;
    this.attack_view.textContent = this.attack.value;
  }

  releaseset(){
    seigyo_elements[sentaku].effectnode.release.value = this.release.value; //コンプのスレショルドを書き換える
    this.release_view.textContent = this.release.value; //スライダーの数字の表示を変える
    seigyo_elements[sentaku].effect_temp[3] = this.release.value;
    this.release_view.textContent = this.release.value;
  }

  graph(){
    comp_canvas_ctx.clearRect(0, 0, comp_canvas.width, comp_canvas.height);
    comp_canvas_ctx.beginPath();
    comp_canvas_ctx.strokeStyle = 'black';
    comp_canvas_ctx.moveTo(comp_canvas.width - (comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]),(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
    comp_canvas_ctx.lineTo(0,comp_canvas.height);
    comp_canvas_ctx.stroke();
    
    comp_canvas_ctx.beginPath();
    comp_canvas_ctx.strokeStyle = 'black';
    comp_canvas_ctx.moveTo(comp_canvas.width - (comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]),(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
    comp_canvas_ctx.lineTo(comp_canvas.width,((comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0])) - (((comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0])) / seigyo_elements[sentaku].effect_temp[1]));
    comp_canvas_ctx.stroke();
    
    comp_canvas_ctx.beginPath();
    comp_canvas_ctx.strokeStyle = 'orangered';
    comp_canvas_ctx.moveTo(0,(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
    comp_canvas_ctx.lineTo(comp_canvas.width,(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
    comp_canvas_ctx.stroke();
  }
}

//ここまでクラス

var audio = []
var douji = document.querySelector('#douji');
var saiseijikan = document.querySelector('#saiseijikan');
var max_audio; //一番再生時間が長い音源の要素の場所
var saisei_flag = false; //再生してるかどうかを判定するフラグ
for( let element of document.querySelectorAll('.seigyo') ) {
  audio.push(element.querySelector('#audio'));
}
douji.addEventListener('click', function( event ) { //再生のボタンを押したときの動作
  if(saisei_flag == false){
    for(var i = 0; i < audio.length; i++){
      audio[i].play();
    }
    audio[max_audio].addEventListener('timeupdate', function( event ){
      if(Math.floor(audio[max_audio].currentTime % 60).toString().length == 1){
        var sec = "0" + Math.floor(audio[max_audio].currentTime % 60);
      }
      else{
        var sec = Math.floor(audio[max_audio].currentTime % 60);
      }
      var min = Math.floor(audio[max_audio].currentTime / 60);
      saiseijikan.textContent = min + ":" + sec;
      saiseiichi.value = audio[max_audio].currentTime;

    }, true);
    saisei_flag = true;
    douji.value = "停止";
  }
  else{
    for(var i = 0; i < audio.length; i++){
      audio[i].pause();
    }
    saisei_flag = false;
    douji.value = "再生";
  }
});

var saiseiichi = document.querySelector('#saiseiichi');
saiseiichi.addEventListener('input', function( event ) { //再生位置のスライダーを動かしたときの動作
  for(var i = 0; i < audio.length; i++){
    if(audio[i].duration > saiseiichi.value){
      audio[i].currentTime = saiseiichi.value;
      if(saisei_flag == true){
        audio[i].play();
      }
    }
  }
  if(Math.floor(audio[max_audio].currentTime % 60).toString().length == 1){
    var sec = "0" + Math.floor(audio[max_audio].currentTime % 60);
  }
  else{
    var sec = Math.floor(audio[max_audio].currentTime % 60);
  }
  var min = Math.floor(audio[max_audio].currentTime / 60);
  saiseijikan.textContent = min + ":" + sec;
  saiseiichi.value = audio[max_audio].currentTime;
});

var volume = document.querySelector('#volume');
var volumedb = document.querySelector('#volumedb');
volume.addEventListener('input', function( event ) { //volumeのスライダーを動かしたときの動作
  seigyo_elements[sentaku].gainNode.gain.value = volume.value;
  seigyo_elements[sentaku].volume_temp = volume.value; //ボリュームの値の一時保存 ミュートとソロの時に使う
  volumedb.textContent = Math.round(volume.value * 100);
});

var pan = document.querySelector('#pan');
var direction = document.querySelector('#direction');
pan.addEventListener('input', function( event ) { //panのスライダーを動かしたときの動作
  seigyo_elements[sentaku].Pannode.pan.value = pan.value;
  if(pan.value == 0){
    direction.textContent = "C";
  }
  else if(pan.value < 0){
    direction.textContent = "L" + Math.round(Math.abs(pan.value) * 100);
  }
  else{
    direction.textContent = "R" + Math.round(pan.value * 100);
  }
});

window.AudioContext = window.AudioContext || window.webkitAudioContext;
var number_of_seigyo = 6; //制御する音源の数
var seigyo_elements = new Array(number_of_seigyo); //音源の制御する配列

var preset = []; //demoのプリセットを格納する配列
preset[0] = [0,2,0.003,0.25];
preset[1] = [0,2,0.003,0.25]; 
preset[2] = [0,2,0.003,0.25];
preset[3] = [0,2,0.003,0.25];
preset[4] = [0,2,0.003,0.25];
var preset_name = ["Vocal.mp3","Drums.mp3","Piano.mp3","Guitar.mp3","Bass.mp3"];

for(var i = 0; i < number_of_seigyo; i++) {
  var audioCtx = new AudioContext();
  var gainNode = audioCtx.createGain(); //ボリュームを変えるノードを作成
  var Pannode = audioCtx.createStereoPanner(); //パンのノード

  var analyserNode_before = audioCtx.createAnalyser(); //エフェクターで効果を与える前のアナライザー
  analyserNode_before.fftSize = 2048;
  analyserNode_before.minDecibels = -100;
  analyserNode_before.maxDecibels = 0;

  var analyserNode_after = audioCtx.createAnalyser(); //エフェクターで効果を与えた後のアナライザー
  analyserNode_after.fftSize = 2048;
  analyserNode_after.minDecibels = -100;
  analyserNode_after.maxDecibels = 0;
  var effectnode = audioCtx.createDynamicsCompressor();

  if(preset_temp != undefined){
    effectnode.threshold.value = preset_temp[0];
    effectnode.ratio.value = preset_temp[1];
    effectnode.attack.value = preset_temp[2];
    effectnode.release.value = preset_temp[3];
    effectnode.knee.value = 40;
  }
  else{
    effectnode.threshold.value = 0;
    effectnode.ratio.value = 2;
    effectnode.attack.value = 0.003;
    effectnode.release.value = 0.25;
    effectnode.knee.value = 40;
  }

  var preset_temp = preset[i]; //presetの中の配列を取り出す
  seigyo_elements[i] = new seigyo(audioCtx,gainNode,effectnode,analyserNode_before,analyserNode_after,Pannode,preset_temp,preset_name[i]); //音源の制御のインスタンスを格納
}

var sentaku = 0; //いまどの音源を操作するのかの値
var source = new Array(number_of_seigyo);
var url; //src

var i = 0;
for( let element of document.querySelectorAll('.seigyo') ) { //インスタンスを生成
  seigyo_elements[i].touroku( element,i );
  i++;
}

let effect_set = new effectset(); //エフェクトを操作するインスタンス

//ここからグラフの描画
var comp_canvas_text = document.querySelector('#comp_canvas_text');
var comp_canvas_text_ctx = comp_canvas_text.getContext('2d');
var comp_canvas = document.querySelector('#comp_canvas');
var comp_canvas_ctx = comp_canvas.getContext('2d');
var zahyou_sa = (comp_canvas_text.height - comp_canvas.height) / 2; //グラフを描画するcanvasとテキストとグリッドを表示するcanvasの間にできる空白の大きさ

comp_canvas_text_ctx.beginPath();
comp_canvas_text_ctx.strokeStyle = "rgb(255,150,150)";
for(var i = 0 ; i < 5 ; i++){
  comp_canvas_text_ctx.moveTo(zahyou_sa,zahyou_sa + (comp_canvas.height / 4) * i);
  comp_canvas_text_ctx.lineTo(zahyou_sa + comp_canvas.width,zahyou_sa + (comp_canvas.height / 4) * i);
  comp_canvas_text_ctx.font = '11pt sans-serif';
  var measure = comp_canvas_text_ctx.measureText( -20 * i );
  comp_canvas_text_ctx.fillText( -20 * i , zahyou_sa - 30 - (measure.width / 2), zahyou_sa + (comp_canvas.height / 4) * i);

  comp_canvas_text_ctx.moveTo(zahyou_sa + (comp_canvas.width / 4) * i,zahyou_sa);
  comp_canvas_text_ctx.lineTo(zahyou_sa + (comp_canvas.width / 4) * i,zahyou_sa + comp_canvas.height);
  comp_canvas_text_ctx.font = '11pt sans-serif';
  var measure = comp_canvas_text_ctx.measureText( -20 * i );
  comp_canvas_text_ctx.fillText( -20 * i , comp_canvas_text.width - zahyou_sa - (measure.width / 2) + (comp_canvas.width / 4) * -i ,comp_canvas_text.height - zahyou_sa + 30);
}

var measure = comp_canvas_text_ctx.measureText( "[db]" );
comp_canvas_text_ctx.fillText( "[db]" , zahyou_sa - 30 - (measure.width / 2), 25);
comp_canvas_text_ctx.fillText( "[db]" , comp_canvas_text.width - zahyou_sa + 30 - (measure.width / 2), comp_canvas_text.height - zahyou_sa + 30);
comp_canvas_text_ctx.stroke();

comp_canvas_ctx.beginPath();
comp_canvas_ctx.strokeStyle = 'black';
comp_canvas_ctx.moveTo(comp_canvas.width - (comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]),(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
comp_canvas_ctx.lineTo(0,comp_canvas.height);
comp_canvas_ctx.stroke();

comp_canvas_ctx.beginPath();
comp_canvas_ctx.strokeStyle = 'black';
comp_canvas_ctx.moveTo(comp_canvas.width - (comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]),(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
comp_canvas_ctx.lineTo(comp_canvas.width,((comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0])) - (((comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0])) / seigyo_elements[sentaku].effect_temp[1]));
comp_canvas_ctx.stroke();

comp_canvas_ctx.beginPath();
comp_canvas_ctx.strokeStyle = 'orangered';
comp_canvas_ctx.moveTo(0,(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
comp_canvas_ctx.lineTo(comp_canvas.width,(comp_canvas.height / 80) * Math.abs(seigyo_elements[sentaku].effect_temp[0]));
comp_canvas_ctx.stroke();
//ここまでグラフの描画

//メーターの描画
var meter_canvas = document.querySelector('#meter_canvas');
var meter_canvas_ctx = meter_canvas.getContext('2d');
var meter_canvas_text = document.querySelector('#meter_canvas_text');
var meter_canvas_text_ctx = meter_canvas_text.getContext('2d');
//ここからグリッドとテキスト
meter_canvas_text_ctx.beginPath();
meter_canvas_text_ctx.strokeStyle = "rgb(255,150,150)";
var answer;
var y_temp;
for(var i = 0 ; i < 6 ; i++){
  if(i <= 1){
    if(i == 0){
      answer = 0;
    }
    else{
      answer = -5
    }
    meter_canvas_text_ctx.moveTo(zahyou_sa,zahyou_sa + (meter_canvas.height / 3) * i);
    meter_canvas_text_ctx.lineTo(zahyou_sa + meter_canvas.width,zahyou_sa + (meter_canvas.height / 3) * i);
    meter_canvas_text_ctx.font = '11pt sans-serif';
    var measure = meter_canvas_text_ctx.measureText( answer );
    meter_canvas_text_ctx.fillText( answer , zahyou_sa - 30 - (measure.width / 2), zahyou_sa + (meter_canvas.height / 3) * i);
    y_temp = meter_canvas.height / 3;
  }
  else if(i <= 4){
    answer = answer * 2;
    meter_canvas_text_ctx.moveTo(zahyou_sa,zahyou_sa + y_temp + ((meter_canvas.height - y_temp) / 2));
    meter_canvas_text_ctx.lineTo(zahyou_sa + meter_canvas.width,zahyou_sa + y_temp + ((meter_canvas.height - y_temp) / 2));
    meter_canvas_text_ctx.font = '11pt sans-serif';
    var measure = meter_canvas_text_ctx.measureText( answer );
    meter_canvas_text_ctx.fillText( answer , zahyou_sa - 30 - (measure.width / 2), zahyou_sa + y_temp + ((meter_canvas.height - y_temp) / 2));
    y_temp = y_temp + ((meter_canvas.height - y_temp) / 2);
  }
  else{
    answer = answer * 2;
    meter_canvas_text_ctx.moveTo(zahyou_sa,zahyou_sa + meter_canvas.height);
    meter_canvas_text_ctx.lineTo(zahyou_sa + meter_canvas.width,zahyou_sa + meter_canvas.height);
    meter_canvas_text_ctx.font = '11pt sans-serif';
    var measure = meter_canvas_text_ctx.measureText( answer );
    meter_canvas_text_ctx.fillText( answer , zahyou_sa - 30 - (measure.width / 2), zahyou_sa + meter_canvas.height);
  }
}
meter_canvas_text_ctx.moveTo(zahyou_sa,zahyou_sa);
meter_canvas_text_ctx.lineTo(zahyou_sa,zahyou_sa + meter_canvas.height);
meter_canvas_text_ctx.moveTo(zahyou_sa + meter_canvas.width,zahyou_sa);
meter_canvas_text_ctx.lineTo(zahyou_sa + meter_canvas.width,zahyou_sa + meter_canvas.height);
var measure = meter_canvas_text_ctx.measureText( "[db]" );
meter_canvas_text_ctx.fillText( "[db]" , zahyou_sa - 30 - (measure.width / 2), 25);
meter_canvas_text_ctx.stroke();
//ここまでグリッドとテキスト

window.setInterval(function() { //描画を繰り返す
  var times_before = new Float32Array(256);
  seigyo_elements[sentaku].analyserNode_before.getFloatTimeDomainData(times_before);
  var before_peak = 0;
  for(i=0;i<256;i++){
    if(times_before[i] < 0){
      var before_peak_temp = -times_before[i];
    }
    else{
      var before_peak_temp = times_before[i];
    }
    if(before_peak < before_peak_temp){
      var before_peak = before_peak_temp;
    }
  }
  before_peak = 10 * Math.log10(before_peak); //デシベルに変換
  console.log(before_peak);
  meter_canvas_ctx.clearRect(0, 0, meter_canvas.width, meter_canvas.height);
  meter_canvas_ctx.globalAlpha = 0.5;
  meter_canvas_ctx.fillStyle = 'blue';
  meter_canvas_ctx.beginPath();

  if(before_peak >= -10){
    meter_canvas_ctx.fillRect(0,-20*before_peak,25,400);
  }
  else if(i >= -20){
    meter_canvas_ctx.fillRect(0,200 + -5*(before_peak + 10),25,400);
  }
  else if(i >= -40){
    meter_canvas_ctx.fillRect(0,250 + -1.25*(before_peak + 20),25,400);
  }
  else{
    meter_canvas_ctx.fillRect(0,275 + -0.625*(before_peak + 40),25,400);
  }
  meter_canvas_ctx.stroke();

  var times_after = new Float32Array(256);
  seigyo_elements[sentaku].analyserNode_after.getFloatTimeDomainData(times_after);
  var after_peak = 0;
  for(i=0;i<256;i++){
    if(times_after[i] < 0){
      var after_peak_temp = -times_after[i];
    }
    else{
      var after_peak_temp = times_after[i];
    }
    if(after_peak < after_peak_temp){
      var after_peak = after_peak_temp;
    }
  }
  after_peak = 10 * Math.log10(after_peak); //デシベルに変換
  meter_canvas_ctx.fillStyle = 'red';
  meter_canvas_ctx.beginPath();
  if(after_peak >= -10){
    meter_canvas_ctx.fillRect(25,-20*after_peak,50,400);
  }
  else if(after_peak >= -20){
    meter_canvas_ctx.fillRect(25,200 + -5*(after_peak + 10),50,400);
  }
  else if(after_peak >= -40){
    meter_canvas_ctx.fillRect(25,250 + -1.25*(after_peak + 20),50,400);
  }
  else{
    meter_canvas_ctx.fillRect(25,275 + -0.625*(after_peak + 40),50,400);
  }
  meter_canvas_ctx.stroke();
}, 50);