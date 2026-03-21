//+------------------------------------------------------------------+
//|                                               TS_AllInOne_EA.mq5 |
//|   Multi-Strategy EA (Tiên Sanh style): DaoGam, LuuDan,           |
//|   NhipThoiMien, VungToi, CuaSoThoiGian, Radar, Phao (Exit)       |
//|   Author: ChatGPT (GPT-5 Thinking)                                |
//|   Note: Heuristic implementations for backtest & live usage       |
//+------------------------------------------------------------------+
#property strict
#property description "All-in-one EA: Price Action + Crowd Trap + Time Windows."
#property version   "1.0"

#include <Trade/Trade.mqh>
CTrade trade;

//--------------------------- Inputs: General ---------------------------
input double InpRiskPercent              = 1.0;   // % rủi ro mỗi lệnh
input int    InpMaxSpreadPoints          = 30;    // Max spread (points)
input int    InpSlippagePoints           = 10;    // Slippage (points)
input int    InpLookbackBars             = 500;   // Số nến quét mẫu hình
input ENUM_TIMEFRAMES InpSignalTF        = PERIOD_H1; // TF tín hiệu chính
input ENUM_TIMEFRAMES InpConfirmTF       = PERIOD_H4; // TF xác nhận xu hướng
input int    InpMinRRx100                = 150;   // RR tối thiểu (x100) ví dụ 150=1:1.5
input int    InpMagicBase                = 762300; // Magic base
input bool   InpOnePosPerSymbol          = true;  // 1 vị thế/symbol?

//--------------------------- Inputs: Enable Strategies -----------------
input bool Enable_DaoGam                 = true;
input bool Enable_LuuDan                = true;
input bool Enable_NhipThoiMien          = true;
input bool Enable_VungToi               = true;
input bool Enable_CuaSoThoiGian         = true;
input bool Enable_Radar                 = true;

//--------------------------- Inputs: DaoGam (False Break) -------------
input int    DG_SwingLeftRight           = 3;     // xác định đỉnh/đáy cục bộ
input double DG_EngulfBodyFrac           = 0.7;   // nến đảo chiều: thân >= 70% biên
input int    DG_LookbackSwings           = 8;     // số swing gần nhất để làm S/R
input double DG_SL_Buffer_Points         = 50;    // buffer SL dưới/ trên bấc
input double DG_ATR_StopMult             = 1.2;   // SL tối thiểu = ATR*mult
input double DG_TP_R_Mult                = 2.0;   // TP = R*mult (TP1 hộp 2)

//--------------------------- Inputs: LuuDan (Runner) -------------------
input bool   LD_KeepRunner               = true;  // giữ 1 phần lệnh chạy xa
input double LD_Runner_TP_R_Mult         = 5.0;   // TP xa
input double LD_Trail_ATR_Mult           = 2.0;   // trailing theo ATR
input int    LD_MA_Period_Confirm        = 50;    // xu hướng Confirm TF qua MA

//--------------------------- Inputs: NhipThoiMien (3 touches) ---------
input int    NTM_MA_Period               = 200;   // dùng MA như "trendline động"
input int    NTM_MinTouches              = 3;     // số lần tôn trọng tối thiểu
input int    NTM_MaxBarsBetweenTouches   = 300;   // RÕ-MẠNH-GẦN: khoảng cách tối đa
input double NTM_BreakBodyFrac           = 0.6;   // thân phá vỡ >= 60% range

//--------------------------- Inputs: VungToi (Monday no-gap) ----------
input int    VT_H1_BodyPointsMin         = 300;   // thân H1 mở tuần tối thiểu
input int    VT_NoGapPointsMax           = 50;    // chênh open tuần vs close tuần trước
input int    VT_Window1_StartHour        = 9;     // giờ VN tương đối -> chỉnh theo server
input int    VT_Window1_EndHour          = 10;
input int    VT_Window2_StartHour        = 20;
input int    VT_Window2_EndHour          = 21;
input double VT_ReturnThresholdPoints    = 50;    // mức “về gần open tuần”
input double VT_TP_Points                = 150;   // mục tiêu về gần điểm open tuần

//--------------------------- Inputs: CuaSoThoiGian (cycle) ------------
input int    CST_MinWavesForAvg          = 3;     // số sóng để tính chu kỳ TB
input double CST_TriggerFactor           = 1.2;   // khi thời lượng sóng hiện tại >= 1.2 * avg
input int    CST_MinBarsWindow           = 12;    // cửa sổ thời gian cảnh báo tối thiểu (bars)

//--------------------------- Inputs: Radar (confluence) ----------------
input int    RD_RSI_Period               = 14;
input int    RD_RSI_OB                   = 70;
input int    RD_RSI_OS                   = 30;
input int    RD_PivotLookbackDays        = 1;     // PP, R1, S1 ngày trước
input int    RD_RoundNumberStepPoints    = 500;   // bội số round number
input int    RD_MinConfluences           = 2;     // cần >=2 confluence để bật cờ
input double RD_ConfirmBodyFrac          = 0.6;   // nến xác nhận đảo chiều

//--------------------------- Inputs: Phao (Exit logic) -----------------
input double PX_ATR_TakeProfitMult       = 2.0;   // TP động theo ATR
input double PX_ATR_StopTightenMult      = 1.0;   // siết SL khi đạt R>=1
input bool   PX_TimeBasedExitEnable      = true;
input int    PX_TimeBarsMax              = 24;    // thoát nếu quá X bars không chạy

//--------------------------- Internals --------------------------------
int      DigitsAdjust;
double   PipPoint;
MqlTick  lastTick;
int      handleATR_Sig, handleATR_Confirm, handleMA_Confirm, handleMA_NTM;
int      magicDG, magicLD, magicNTM, magicVT, magicCST, magicRD;

datetime weekPrevCloseTime=0;
double   weekPrevClosePrice=EMPTY_VALUE;
datetime weekOpenTime=0;
double   weekOpenPrice=EMPTY_VALUE;

//--------------------------- Utils ------------------------------------
double GetPipPoint()
{
   // Pip point (for 5-digit brokers: 10*Point)
   if((int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS) == 3 ||
      (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS) == 5) return Point()*10.0;
   return Point();
}

bool SpreadOK()
{
   SymbolInfoTick(_Symbol,lastTick);
   double sp = (lastTick.ask - lastTick.bid)/Point();
   return sp <= InpMaxSpreadPoints;
}

double ATR(ENUM_TIMEFRAMES tf,int period,int shift=0)
{
   int h = iATR(_Symbol,tf,period);
   if(h==INVALID_HANDLE) return 0.0;
   double buff[];
   if(CopyBuffer(h,0,shift,2,buff)<=0) return 0.0;
   return buff[0];
}

// simple swing high/low
int FindRecentSwingHigh(int left,int right,int start_shift,int max_bars,double &priceOut)
{
   int counted=0;
   for(int i=start_shift+left; i<start_shift+max_bars; ++i)
   {
      bool isHigh=true;
      double hi = iHigh(_Symbol, InpSignalTF, i);
      for(int l=1; l<=left; ++l){ if(iHigh(_Symbol,InpSignalTF,i-l)>hi) {isHigh=false; break;} }
      for(int r=1; r<=right; ++r){ if(iHigh(_Symbol,InpSignalTF,i+r)>hi) {isHigh=false; break;} }
      if(isHigh){ priceOut=hi; return i; }
      if(++counted>max_bars) break;
   }
   return -1;
}

int FindRecentSwingLow(int left,int right,int start_shift,int max_bars,double &priceOut)
{
   int counted=0;
   for(int i=start_shift+left; i<start_shift+max_bars; ++i)
   {
      bool isLow=true;
      double lo = iLow(_Symbol, InpSignalTF, i);
      for(int l=1; l<=left; ++l){ if(iLow(_Symbol,InpSignalTF,i-l)<lo) {isLow=false; break;} }
      for(int r=1; r<=right; ++r){ if(iLow(_Symbol,InpSignalTF,i+r)<lo) {isLow=false; break;} }
      if(isLow){ priceOut=lo; return i; }
      if(++counted>max_bars) break;
   }
   return -1;
}

double BodyFrac(ENUM_TIMEFRAMES tf,int shift)
{
   double o=iOpen(_Symbol,tf,shift), c=iClose(_Symbol,tf,shift);
   double h=iHigh(_Symbol,tf,shift), l=iLow(_Symbol,tf,shift);
   double range = MathMax(1e-6, h-l);
   return MathAbs(c-o)/range;
}

bool BullishEngulf(ENUM_TIMEFRAMES tf,int shift)
{
   double o1=iOpen(_Symbol,tf,shift+1), c1=iClose(_Symbol,tf,shift+1);
   double o=iOpen(_Symbol,tf,shift), c=iClose(_Symbol,tf,shift);
   return (c>o) && (c>=MathMax(o1,c1)) && (o<=MathMin(o1,c1));
}

bool BearishEngulf(ENUM_TIMEFRAMES tf,int shift)
{
   double o1=iOpen(_Symbol,tf,shift+1), c1=iClose(_Symbol,tf,shift+1);
   double o=iOpen(_Symbol,tf,shift), c=iClose(_Symbol,tf,shift);
   return (c<o) && (c<=MathMin(o1,c1)) && (o>=MathMax(o1,c1));
}

double LotsFromRisk(double stop_points)
{
   if(stop_points<=0) return 0.0;
   double accBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskMoney  = accBalance * InpRiskPercent/100.0;

   // tick value per lot
   double tickval = SymbolInfoDouble(_Symbol,SYMBOL_TRADE_TICK_VALUE);
   double ticksize= SymbolInfoDouble(_Symbol,SYMBOL_TRADE_TICK_SIZE);
   double valuePerPoint = tickval / ticksize; // approx

   double lots = riskMoney / (stop_points * valuePerPoint);
   double minLot= SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MIN);
   double lotStep= SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_STEP);
   double maxLot= SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MAX);

   // normalize
   lots = MathFloor(lots/lotStep)*lotStep;
   lots = MathMax(minLot, MathMin(lots, maxLot));
   return lots;
}

bool HasOpenPositionByMagic(int magic)
{
   for(int i=PositionsTotal()-1;i>=0;--i)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      if((int)PositionGetInteger(POSITION_MAGIC)==magic && PositionGetString(POSITION_SYMBOL)==_Symbol)
         return true;
   }
   return false;
}

//--------------------------- Strategy: DaoGam --------------------------
// False break S/R + strong reverse candle. SL = beyond wick or ATR floor.
// TP = R multiple (TP1 ~ “Hộp 2”)
bool Signal_DaoGam(int &dir,double &sl_price,double &tp_price)
{
   dir=0; sl_price=0; tp_price=0;
   // find recent S/R
   double sLow,sHigh;
   int idxLow = FindRecentSwingLow(DG_SwingLeftRight,DG_SwingLeftRight,1,InpLookbackBars,sLow);
   int idxHigh= FindRecentSwingHigh(DG_SwingLeftRight,DG_SwingLeftRight,1,InpLookbackBars,sHigh);
   if(idxLow<0 || idxHigh<0) return false;

   int shift=0; // current closed-1 -> use shift=1 for safety on close logic
   // Bear trap (false break down then bullish engulf)
   bool falseDown = (iLow(_Symbol,InpSignalTF,shift) < sLow && BullishEngulf(InpSignalTF,shift));
   bool bodyBigUp = BodyFrac(InpSignalTF,shift) >= DG_EngulfBodyFrac;

   // Bull trap (false break up then bearish engulf)
   bool falseUp   = (iHigh(_Symbol,InpSignalTF,shift) > sHigh && BearishEngulf(InpSignalTF,shift));
   bool bodyBigDn = BodyFrac(InpSignalTF,shift) >= DG_EngulfBodyFrac;

   if(falseDown && bodyBigUp)
   {
      dir=ORDER_TYPE_BUY;
      double wickLow = iLow(_Symbol,InpSignalTF,shift);
      double atr     = ATR(InpSignalTF,14,shift);
      double sl      = MathMin(iOpen(_Symbol,InpSignalTF,shift), iClose(_Symbol,InpSignalTF,shift)) - DG_SL_Buffer_Points*Point();
      sl = MathMin(sl, wickLow - DG_SL_Buffer_Points*Point());
      double sl_min  = iClose(_Symbol,InpSignalTF,shift) - DG_ATR_StopMult*atr;
      sl = MathMin(sl, sl_min);
      double entry   = iClose(_Symbol,InpSignalTF,shift);
      double stopPts = (entry - sl)/Point();
      double rrMin   = InpMinRRx100/100.0;
      double tp      = entry + DG_TP_R_Mult*stopPts*Point();
      if((entry-sl)>0 && (tp-entry)/(entry-sl) >= rrMin){ sl_price=sl; tp_price=tp; return true; }
   }
   if(falseUp && bodyBigDn)
   {
      dir=ORDER_TYPE_SELL;
      double wickHigh= iHigh(_Symbol,InpSignalTF,shift);
      double atr     = ATR(InpSignalTF,14,shift);
      double sl      = MathMax(iOpen(_Symbol,InpSignalTF,shift), iClose(_Symbol,InpSignalTF,shift)) + DG_SL_Buffer_Points*Point();
      sl = MathMax(sl, wickHigh + DG_SL_Buffer_Points*Point());
      double sl_min  = iClose(_Symbol,InpSignalTF,shift) + DG_ATR_StopMult*atr;
      sl = MathMax(sl, sl_min);
      double entry   = iClose(_Symbol,InpSignalTF,shift);
      double stopPts = (sl - entry)/Point();
      double rrMin   = InpMinRRx100/100.0;
      double tp      = entry - DG_TP_R_Mult*stopPts*Point();
      if((sl-entry)>0 && (entry-tp)/(sl-entry) >= rrMin){ sl_price=sl; tp_price=tp; return true; }
   }
   return false;
}

//--------------------------- Strategy: LuuDan (runner) -----------------
// Condition to "promote" a DaoGam into runner: HTF MA confirms new trend.
bool PromoteTo_LuuDan(int direction)
{
   // Use Confirm TF MA(50)
   int hMA = iMA(_Symbol, InpConfirmTF, LD_MA_Period_Confirm, 0, MODE_EMA, PRICE_CLOSE);
   if(hMA==INVALID_HANDLE) return false;
   double ma[];
   if(CopyBuffer(hMA,0,0,2,ma)<=0) return false;
   double price = iClose(_Symbol, InpConfirmTF, 0);
   if(direction==ORDER_TYPE_BUY)  return price > ma[0];
   if(direction==ORDER_TYPE_SELL) return price < ma[0];
   return false;
}

//--------------------------- Strategy: NhipThoiMien --------------------
// Approx: price respects MA200 (as dynamic trendline) >= N touches, then strong break opposite.
bool Signal_NhipThoiMien(int &dir,double &sl_price,double &tp_price)
{
   dir=0; sl_price=0; tp_price=0;
   int hMA = iMA(_Symbol, InpSignalTF, NTM_MA_Period, 0, MODE_EMA, PRICE_CLOSE);
   if(hMA==INVALID_HANDLE) return false;
   double ma[], closep[], highp[], lowp[];
   int bars = MathMin(InpLookbackBars, 1000);
   if(CopyBuffer(hMA,0,0,bars,ma)<=0) return false;
   if(CopyClose(_Symbol, InpSignalTF, 0, bars, closep)<=0) return false;
   if(CopyHigh(_Symbol, InpSignalTF, 0, bars, highp)<=0) return false;
   if(CopyLow(_Symbol,  InpSignalTF, 0, bars, lowp)<=0) return false;

   // count touches where price bounces from MA side consistently
   int touches=0;
   int lastSide=0; // 1 above, -1 below
   int barsSinceLast=0;
   for(int i=bars-1; i>=1; --i)
   {
      int side = (closep[i] > ma[i])? 1 : -1;
      if(lastSide==0){ lastSide=side; continue; }
      if(side!=lastSide)
      {
         // a "touch" when crossing & rejecting within small window
         if(MathAbs(closep[i]-ma[i]) <= 0.3*ATR(InpSignalTF,14,i))
         {
            touches++;
            barsSinceLast=0;
            lastSide=side;
            if(touches>=NTM_MinTouches) break;
         }
      }
      barsSinceLast++;
      if(barsSinceLast>NTM_MaxBarsBetweenTouches) break;
   }
   if(touches<NTM_MinTouches) return false;

   // Strong break opposite on the latest closed bar
   int sh=0;
   double body = BodyFrac(InpSignalTF, sh);
   double o=iOpen(_Symbol,InpSignalTF,sh), c=iClose(_Symbol,InpSignalTF,sh);
   double m=ma[sh];
   if(body < NTM_BreakBodyFrac) return false;

   if(c<m && o>m) // break down
   {
      dir=ORDER_TYPE_SELL;
      double sl = MathMax(o,c) + PX_ATR_StopTightenMult*ATR(InpSignalTF,14,sh);
      double entry=c;
      double stopPts=(sl-entry)/Point();
      double tp = entry - DG_TP_R_Mult*stopPts*Point();
      sl_price=sl; tp_price=tp; return true;
   }
   if(c>m && o<m) // break up
   {
      dir=ORDER_TYPE_BUY;
      double sl = MathMin(o,c) - PX_ATR_StopTightenMult*ATR(InpSignalTF,14,sh);
      double entry=c;
      double stopPts=(entry-sl)/Point();
      double tp = entry + DG_TP_R_Mult*stopPts*Point();
      sl_price=sl; tp_price=tp; return true;
   }
   return false;
}

//--------------------------- Strategy: VungToi (Monday no-gap) --------
bool IsMonday(datetime t)
{
   MqlDateTime dt; TimeToStruct(t,dt);
   return dt.day_of_week==1;
}

bool Signal_VungToi(int &dir,double &sl_price,double &tp_price)
{
   dir=0; sl_price=0; tp_price=0;

   // Determine weekly open & previous close (on first call of new week)
   MqlDateTime now; TimeToStruct(TimeCurrent(),now);
   // Compute last weekly close / this weekly open once per week
   // Simplification: take first H1 bar of Monday as "open week"
   int sh=0;
   if(weekOpenTime==0 || TimeToStruct(TimeCurrent(),now)==1)
   {
      // find first H1 bar of Monday
      int bars = iBars(_Symbol, PERIOD_H1);
      for(int i=bars-1;i>=0;--i)
      {
         datetime t = iTime(_Symbol,PERIOD_H1,i);
         MqlDateTime d; TimeToStruct(t,d);
         if(d.day_of_week==1 && d.hour==0) { weekOpenTime=t; weekOpenPrice=iOpen(_Symbol,PERIOD_H1,i); break; }
      }
      // previous week's last H1 close
      for(int i=bars-1;i>=0;--i)
      {
         datetime t = iTime(_Symbol,PERIOD_H1,i);
         MqlDateTime d; TimeToStruct(t,d);
         if(d.day_of_week==0 && d.hour==23) { weekPrevCloseTime=t; weekPrevClosePrice=iClose(_Symbol,PERIOD_H1,i); break; }
      }
   }
   if(weekOpenTime==0 || weekPrevCloseTime==0) return false;

   // No-gap condition
   double gapPts = MathAbs(weekOpenPrice - weekPrevClosePrice)/Point();
   if(gapPts > VT_NoGapPointsMax) return false;

   // Check Monday windows
   MqlDateTime dt; TimeToStruct(TimeCurrent(),dt);
   if(!IsMonday(TimeCurrent())) return false;
   bool inWin1 = (dt.hour>=VT_Window1_StartHour && dt.hour<VT_Window1_EndHour);
   bool inWin2 = (dt.hour>=VT_Window2_StartHour && dt.hour<VT_Window2_EndHour);
   if(!(inWin1||inWin2)) return false;

   // First H1 bar body size
   // Find Monday first H1 bar
   int bars = iBars(_Symbol, PERIOD_H1);
   int idxMonFirst=-1;
   for(int i=bars-1;i>=0;--i)
   {
      datetime t = iTime(_Symbol,PERIOD_H1,i);
      MqlDateTime d; TimeToStruct(t,d);
      if(d.day_of_week==1 && d.hour==0){ idxMonFirst=i; break; }
   }
   if(idxMonFirst<0) return false;
   double o=iOpen(_Symbol,PERIOD_H1,idxMonFirst), c=iClose(_Symbol,PERIOD_H1,idxMonFirst);
   double bodyPts = MathAbs(c-o)/Point();
   if(bodyPts < VT_H1_BodyPointsMin) return false;

   // Revert to weekly open (return threshold) and cross back
   double price = SymbolInfoDouble(_Symbol,SYMBOL_BID);
   double distToOpenPts = (price - weekOpenPrice)/Point();

   // If first bar was bullish strong => fade it when price crosses below weekly open
   if(c>o)
   {
      if(distToOpenPts < -VT_ReturnThresholdPoints)
      {
         dir=ORDER_TYPE_SELL;
         sl_price = weekOpenPrice + VT_ReturnThresholdPoints*Point();
         tp_price = weekOpenPrice - VT_TP_Points*Point();
         return true;
      }
   }
   // If first bar was bearish strong => fade it when price crosses above weekly open
   if(c<o)
   {
      if(distToOpenPts > VT_ReturnThresholdPoints)
      {
         dir=ORDER_TYPE_BUY;
         sl_price = weekOpenPrice - VT_ReturnThresholdPoints*Point();
         tp_price = weekOpenPrice + VT_TP_Points*Point();
         return true;
      }
   }
   return false;
}

//--------------------------- Strategy: CuaSoThoiGian (cycle) ----------
// Approx: if current swing duration >= factor * average of last N swings -> open to reversal signals
bool CST_TimeWindowOpen()
{
   // compute swings on SignalTF by zigzag-like approach with ATR threshold
   int N = InpLookbackBars;
   double atr = ATR(InpSignalTF,14,0);
   if(atr<=0) return false;
   double threshold = 1.5*atr; // swing threshold

   double prev= iClose(_Symbol,InpSignalTF, N-1);
   int lastDir=0; // 1 up, -1 down
   int barsCurrSwing=0;
   int swingsCount=0;
   int swingBars[20]; ArrayInitialize(swingBars,0);

   for(int i=N-2;i>=0;--i)
   {
      double c = iClose(_Symbol,InpSignalTF,i);
      double d = c - prev;
      int dir = (d>0)?1:((d<0)?-1:0);
      if(dir!=0 && dir!=lastDir)
      {
         if(MathAbs(d) > threshold)
         {
            if(swingsCount<20) swingBars[swingsCount++] = barsCurrSwing;
            barsCurrSwing=0;
            lastDir=dir;
         }
      }
      barsCurrSwing++;
      prev=c;
   }
   if(swingsCount < CST_MinWavesForAvg) return false;
   // average of last CST_MinWavesForAvg
   int sum=0, cnt=0;
   for(int i=0;i<swingsCount && cnt<CST_MinWavesForAvg; ++i){ sum+=swingBars[i]; cnt++; }
   double avg = (cnt>0)? (double)sum/cnt : 0.0;

   if(barsCurrSwing >= MathMax(CST_MinBarsWindow, (int)MathRound(CST_TriggerFactor*avg)))
      return true;
   return false;
}

//--------------------------- Strategy: Radar (confluence) -------------
bool IsRoundNumber(double price)
{
   double step = RD_RoundNumberStepPoints*Point();
   double r = fmod(MathAbs(price), step);
   return (r <= 0.2*step || r >= 0.8*step);
}

void GetDailyPivots(int daysBack,double &pp,double &r1,double &s1)
{
   // simplistic classic pivot from previous day (server time)
   datetime t = iTime(_Symbol, PERIOD_D1, daysBack);
   double H = iHigh(_Symbol,PERIOD_D1,daysBack);
   double L = iLow(_Symbol,PERIOD_D1,daysBack);
   double C = iClose(_Symbol,PERIOD_D1,daysBack);
   pp = (H+L+C)/3.0;
   r1 = 2*pp - L;
   s1 = 2*pp - H;
}

bool Signal_Radar(int &dir,double &sl_price,double &tp_price)
{
   dir=0; sl_price=0; tp_price=0;

   // Confluences: RSI extreme + (round number or daily pivot or prev high/low) + reversal candle
   int hRSI = iRSI(_Symbol, InpSignalTF, RD_RSI_Period, PRICE_CLOSE);
   if(hRSI==INVALID_HANDLE) return false;
   double rsi[];
   if(CopyBuffer(hRSI,0,0,2,rsi)<=0) return false;
   double price = iClose(_Symbol, InpSignalTF, 0);

   double pp,r1,s1; GetDailyPivots(RD_PivotLookbackDays, pp,r1,s1);
   double yHigh = iHigh(_Symbol, PERIOD_D1, RD_PivotLookbackDays);
   double yLow  = iLow(_Symbol,  PERIOD_D1, RD_PivotLookbackDays);

   int conf=0;
   bool overbought = (rsi[0]>=RD_RSI_OB);
   bool oversold   = (rsi[0]<=RD_RSI_OS);
   if(overbought||oversold) conf++;

   if(IsRoundNumber(price)) conf++;
   // near PP/R1/S1 or Yesterday H/L within 0.5*ATR
   double atr = ATR(InpSignalTF,14,0);
   double nearTol = 0.5*atr;
   if(MathAbs(price-pp)<=nearTol || MathAbs(price-r1)<=nearTol || MathAbs(price-s1)<=nearTol) conf++;
   if(MathAbs(price-yHigh)<=nearTol || MathAbs(price-yLow)<=nearTol) conf++;

   if(conf < RD_MinConfluences) return false;

   // reversal candle
   if(overbought && BearishEngulf(InpSignalTF,0) && BodyFrac(InpSignalTF,0)>=RD_ConfirmBodyFrac)
   {
      dir=ORDER_TYPE_SELL;
      sl_price = iHigh(_Symbol,InpSignalTF,0) + PX_ATR_StopTightenMult*atr;
      double stopPts=(sl_price-price)/Point();
      tp_price = price - DG_TP_R_Mult*stopPts*Point(); // reuse
      return true;
   }
   if(oversold && BullishEngulf(InpSignalTF,0) && BodyFrac(InpSignalTF,0)>=RD_ConfirmBodyFrac)
   {
      dir=ORDER_TYPE_BUY;
      sl_price = iLow(_Symbol,InpSignalTF,0) - PX_ATR_StopTightenMult*atr;
      double stopPts=(price-sl_price)/Point();
      tp_price = price + DG_TP_R_Mult*stopPts*Point();
      return true;
   }
   return false;
}

//--------------------------- Order Placement ---------------------------
bool PlaceOrder(int magic,int dir,double sl,double tp, string tag)
{
   if(!SpreadOK()) return false;
   double entry = (dir==ORDER_TYPE_BUY)? lastTick.ask : lastTick.bid;
   double stopPts = MathAbs(entry - sl)/Point();
   if(stopPts < 5) return false; // avoid too tight
   double lots = LotsFromRisk(stopPts);
   if(lots <= 0) return false;

   trade.SetExpertMagicNumber(magic);
   trade.SetDeviationInPoints(InpSlippagePoints);
   bool ok=false;
   if(dir==ORDER_TYPE_BUY) ok=trade.Buy(lots,NULL,entry,sl,tp,tag);
   else                    ok=trade.Sell(lots,NULL,entry,sl,tp,tag);
   return ok;
}

//--------------------------- Manage Runner (LuuDan) --------------------
void Manage_Runner(int magic,int dir)
{
   if(!LD_KeepRunner) return;
   // If profit >= 1R, trail by ATR
   for(int i=PositionsTotal()-1;i>=0;--i)
   {
      if(!PositionSelectByTicket(PositionGetTicket(i))) continue;
      if((int)PositionGetInteger(POSITION_MAGIC)!=magic) continue;
      if(PositionGetString(POSITION_SYMBOL)!=_Symbol) continue;

      double entry = PositionGetDouble(POSITION_PRICE_OPEN);
      double sl = PositionGetDouble(POSITION_SL);
      double pr = PositionGetDouble(POSITION_PRICE_CURRENT);
      double atr = ATR(InpSignalTF,14,0);
      double R = MathAbs(entry - sl);

      if(R<=0) continue;
      double profitRun = (dir==ORDER_TYPE_BUY)? (pr-entry) : (entry-pr);
      if(profitRun>=R) // start trail
      {
         double newSL = (dir==ORDER_TYPE_BUY)? (pr - LD_Trail_ATR_Mult*atr) : (pr + LD_Trail_ATR_Mult*atr);
         // never loosen SL
         if(dir==ORDER_TYPE_BUY && newSL>sl) trade.PositionModify(_Symbol, newSL, 0);
         if(dir==ORDER_TYPE_SELL && newSL<sl) trade.PositionModify(_Symbol, newSL, 0);
      }
   }
}

//--------------------------- Time-based Exit (Phao) --------------------
void Manage_TimeExit(int magic)
{
   if(!PX_TimeBasedExitEnable) return;
   for(int i=PositionsTotal()-1;i>=0;--i)
   {
      if(!PositionSelectByTicket(PositionGetTicket(i))) continue;
      if((int)PositionGetInteger(POSITION_MAGIC)!=magic) continue;
      if(PositionGetString(POSITION_SYMBOL)!=_Symbol) continue;

      datetime opent = (datetime)PositionGetInteger(POSITION_TIME);
      int barsOpen = iBarShift(_Symbol, InpSignalTF, opent, false);
      int barsNow  = iBarShift(_Symbol, InpSignalTF, TimeCurrent(), false);
      if(barsOpen<0 || barsNow<0) continue;
      int held = barsOpen - barsNow;
      if(held >= PX_TimeBarsMax)
      {
         trade.PositionClose(_Symbol);
      }
   }
}

//--------------------------- OnInit / OnTick ---------------------------
int OnInit()
{
   PipPoint = GetPipPoint();
   SymbolInfoTick(_Symbol,lastTick);
   magicDG  = InpMagicBase + 1;
   magicLD  = InpMagicBase + 2;
   magicNTM = InpMagicBase + 3;
   magicVT  = InpMagicBase + 4;
   magicCST = InpMagicBase + 5;
   magicRD  = InpMagicBase + 6;
   return(INIT_SUCCEEDED);
}

void OnTick()
{
   if(!SymbolInfoTick(_Symbol,lastTick)) return;
   if(InpOnePosPerSymbol && PositionsTotal()>0)
   {
      // optional: only allow one overall; else comment out this block
   }

   // Recalculate per new bar on Signal TF
   static datetime lastBarTime=0;
   datetime curBarTime = iTime(_Symbol, InpSignalTF, 0);
   bool newBar = (curBarTime != lastBarTime);
   if(!newBar) return;
   lastBarTime = curBarTime;

   int dir; double sl,tp;

   // --- DaoGam ---
   if(Enable_DaoGam && !HasOpenPositionByMagic(magicDG))
   {
      if(Signal_DaoGam(dir,sl,tp))
      {
         string tag="DG";
         if(PlaceOrder(magicDG,dir,sl,tp,tag))
         {
            // If LuuDan conditions, set a runner by widening TP or trailing
            if(Enable_LuuDan && PromoteTo_LuuDan(dir))
            {
               // add a second partial? For simplicity, trail existing via Manage_Runner
            }
         }
      }
   }

   // --- NhipThoiMien ---
   if(Enable_NhipThoiMien && !HasOpenPositionByMagic(magicNTM))
   {
      if(Signal_NhipThoiMien(dir,sl,tp))
      {
         PlaceOrder(magicNTM,dir,sl,tp,"NTM");
      }
   }

   // --- VungToi ---
   if(Enable_VungToi && !HasOpenPositionByMagic(magicVT))
   {
      if(Signal_VungToi(dir,sl,tp))
      {
         PlaceOrder(magicVT,dir,sl,tp,"VT");
      }
   }

   // --- Radar (confluence) ---
   if(Enable_Radar && !HasOpenPositionByMagic(magicRD))
   {
      if(Signal_Radar(dir,sl,tp))
      {
         PlaceOrder(magicRD,dir,sl,tp,"RD");
      }
   }

   // --- Manage LuuDan trailing ---
   if(Enable_LuuDan) 
   {
      Manage_Runner(magicDG,ORDER_TYPE_BUY);
      Manage_Runner(magicDG,ORDER_TYPE_SELL);
   }

   // --- Time exits (Phao style) for all magics ---
   Manage_TimeExit(magicDG);
   Manage_TimeExit(magicNTM);
   Manage_TimeExit(magicVT);
   Manage_TimeExit(magicRD);
}

//+------------------------------------------------------------------+
