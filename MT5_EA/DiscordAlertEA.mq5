//+------------------------------------------------------------------+
//|                                               DiscordAlertEA.mq5 |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "2.10"

// Include Trade for Order Placement if needed
#include <Trade/Trade.mqh>
CTrade trade;

//--- Enums
enum ENUM_DISCORD_MENTION
  {
   MENTION_NONE,     // None
   MENTION_EVERYONE, // @everyone
   MENTION_HERE      // @here
  };

//--- Input parameters
input group "Discord Settings"
input string             DiscordWebhookUrl = "";          // Discord Webhook URL
input ENUM_DISCORD_MENTION DiscordMention  = MENTION_NONE;// Discord Mention
input bool               UseDiscordTTS     = false;       // Use Text-to-Speech
input string             AlertMessage      = "Price Alert!"; // Base Alert Message

input group "Alert Settings (Line/Zone)"
input double             UpperPrice        = 0.0;         // Upper Price Limit (Zone)
input double             LowerPrice        = 0.0;         // Lower Price Limit (Zone)
input bool               UseTrendlineAlert = false;       // Enable Trendline Alert
input string             TrendlinePrefix   = "AlertLine"; // Trendline Name Prefix
input int                AlertCooldown     = 60;          // Cooldown in seconds
input int                TrendlineDeviation= 10;          // Deviation in points (0 = Auto Spread)
input bool               AutoCloseOnAlert  = false;       // Auto Close Positions on Alert
input bool               DebugMode         = true;        // Enable Debug Logs


input group "Pattern Settings (Fractals)"
input bool               UsePatternAlert   = false;       // Enable Double Top/Bottom Alert
input int                PatternTolerance  = 50;          // Max Point Diff between tops/bottoms
input int                PatternLookback   = 50;          // Max candles to scan for 2nd leg

input group "Mobile Settings"
input bool               UsePushNotification = false;     // Send Mobile Push Notification

input group "Indicator: Williams %R"
input bool               UseWilliamsR      = false;       // Enable Williams %R Alert
input ENUM_TIMEFRAMES    WR_Timeframe      = PERIOD_CURRENT; // %R Timeframe
input int                WR_Period         = 14;          // %R Period
input double             WR_Overbought     = -20.0;       // Overbought Level (e.g. -20)
input double             WR_Oversold       = -80.0;       // Oversold Level (e.g. -80)

input group "Indicator: Awesome Oscillator"
input bool               UseAO             = false;       // Enable AO Alert
input ENUM_TIMEFRAMES    AO_Timeframe      = PERIOD_CURRENT; // AO Timeframe

input group "Strategy: AO + WPR + BB (M1 Reversal)"
input bool               UseStrategy_ExtReversal = true;       // Enable Alert
input ENUM_TIMEFRAMES    Ext_Timeframe         = PERIOD_M1;  // Strategy Timeframe
input int                Ext_WPR_Period        = 14;         // WPR Period
input double             Ext_WPR_OB            = -20.0;      // Overbought Level
input double             Ext_WPR_OS            = -80.0;      // Oversold Level
input int                Ext_BB_Period         = 20;         // BB Length (EMA)
input double             Ext_BB_StdDev         = 2.0;        // BB StdDev
input ENUM_APPLIED_PRICE Ext_BB_Price          = PRICE_CLOSE;// BB Price Source

//===================================================================
// START: TS_AllInOne Strategy Inputs
//===================================================================
input group "Strategy: General"
input bool   Enable_Strategy_Alerts      = true;  // Enable Logic Alerts (DaoGam, etc.)
input bool   Enable_Auto_Trade           = false; // Enable Auto Trading (Place Orders)
input double InpRiskPercent              = 1.0;   // % Risk per Trade
input int    InpMaxSpreadPoints          = 30;    // Max spread (points)
input int    InpSlippagePoints           = 10;    // Slippage (points)
input int    InpLookbackBars             = 500;   // Bars to lookback for structure
input ENUM_TIMEFRAMES InpSignalTF        = PERIOD_H1; // Signal Timeframe
input ENUM_TIMEFRAMES InpConfirmTF       = PERIOD_H4; // Confirmation Timeframe
input int    InpMinRRx100                = 150;   // Min RR (x100, 150 -> 1:1.5)
input int    InpMagicBase                = 762300;// Magic Number Base

input group "Strategy: Toggle"
input bool   Enable_DaoGam                 = true;  // Strategy: Dao Gam (False Break)
input bool   Enable_LuuDan                 = true;  // Strategy: Luu Dan (Runner)
input bool   Enable_NhipThoiMien           = true;  // Strategy: Nhip Thoi Mien (3 touches)
input bool   Enable_VungToi                = true;  // Strategy: Vung Toi (Monday Gap)
input bool   Enable_CuaSoThoiGian          = true;  // Strategy: Time Cycle (Alert only)
input bool   Enable_Radar                  = true;  // Strategy: Radar (Confluence)

input group "Strategy: DaoGam"
input int    DG_SwingLeftRight           = 3;     // Swing detection L/R bars
input double DG_EngulfBodyFrac           = 0.7;   // Reversal Candle Body %
input double DG_SL_Buffer_Points         = 50;    // SL Buffer from Wick
input double DG_ATR_StopMult             = 1.2;   // Min SL ATR Multiplier
input double DG_TP_R_Mult                = 2.0;   // TP R Multiple

input group "Strategy: LuuDan"
input bool   LD_KeepRunner               = true;  // Keep Runner Position
input double LD_Runner_TP_R_Mult         = 5.0;   // Runner TP R Mult
input double LD_Trail_ATR_Mult           = 2.0;   // Trailing Stop ATR Mult
input int    LD_MA_Period_Confirm        = 50;    // Confirm MA Period (H4)

input group "Strategy: NhipThoiMien"
input int    NTM_MA_Period               = 200;   // MA Period (Trendline)
input int    NTM_MinTouches              = 3;     // Mm touches
input int    NTM_MaxBarsBetweenTouches   = 300;   // Max bars between touches
input double NTM_BreakBodyFrac           = 0.6;   // Break candle body %

input group "Strategy: VungToi"
input int    VT_H1_BodyPointsMin         = 300;   // H1 Bar Min Size (points)
input int    VT_NoGapPointsMax           = 50;    // Max Gap (points)
input int    VT_Window1_StartHour        = 9;     // Window 1 Start Hour
input int    VT_Window1_EndHour          = 10;    // Window 1 End Hour
input int    VT_Window2_StartHour        = 20;    // Window 2 Start Hour
input int    VT_Window2_EndHour          = 21;    // Window 2 End Hour
input double VT_ReturnThresholdPoints    = 50;    // Return Threshold (points)
input double VT_TP_Points                = 150;   // TP Points (Return to Open)

input group "Strategy: CuaSoTime"
input int    CST_MinWavesForAvg          = 3;     // Min Waves for Avg
input double CST_TriggerFactor           = 1.2;   // Factor > Avg Duration
input int    CST_MinBarsWindow           = 12;    // Min Bars Duration

input group "Strategy: Radar"
input int    RD_RSI_Period               = 14;    // RSI Period
input int    RD_RSI_OB                   = 70;    // RSI Overbought
input int    RD_RSI_OS                   = 30;    // RSI Oversold
input int    RD_PivotLookbackDays        = 1;     // Pivot Days Back
input int    RD_RoundNumberStepPoints    = 500;   // Round Number Step (points)
input int    RD_MinConfluences           = 2;     // Min Confluences
input double RD_ConfirmBodyFrac          = 0.6;   // Reversal Candle Body %

input group "Exit Logic (Phao)"
input double PX_ATR_TakeProfitMult       = 2.0;   // Dynamic TP ATR Mult
input double PX_ATR_StopTightenMult      = 1.0;   // Stop Tighten (BE)
input bool   PX_TimeBasedExitEnable      = true;  // Time Exit
input int    PX_TimeBarsMax              = 24;    // Max Bars Hold

//===================================================================

//--- Global variables
datetime LastAlertTime = 0;
double   LastTickBid   = 0.0;
double   LastTickAsk   = 0.0;
int      hFractals     = INVALID_HANDLE;
int      hWPR          = INVALID_HANDLE;
int      hAO           = INVALID_HANDLE;
int      hAO_Strat     = INVALID_HANDLE;
int      hWPR_Strat    = INVALID_HANDLE;
int      hEMA_Strat    = INVALID_HANDLE;
int      hSTD_Strat    = INVALID_HANDLE;
datetime LastPatternTime = 0;

// Strategy Globals
int      magicDG, magicLD, magicNTM, magicVT, magicCST, magicRD;
datetime weekPrevCloseTime=0;
double   weekPrevClosePrice=EMPTY_VALUE;
datetime weekOpenTime=0;
double   weekOpenPrice=EMPTY_VALUE;
MqlTick  lastTick;

// Forward Declarations
bool SendDiscordAlert(string text);
string JsonEscape(string text);
string CheckWilliamsR();
string CheckAO();
string CheckStrategy_ExtReversal();

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   if(DiscordWebhookUrl == "")
     Print("Warning: Discord Webhook URL is empty!");
     
   if(UpperPrice > 0 && LowerPrice > 0 && UpperPrice <= LowerPrice)
     {
      Print("Error: Upper Price must be greater than Lower Price!");
      return(INIT_FAILED);
     }

   // Initialize Fractals Indicator
   if(UsePatternAlert)
     {
      hFractals = iFractals(_Symbol, PERIOD_CURRENT);
      if(hFractals == INVALID_HANDLE) { Print("Error: Failed to create Fractals indicator handle!"); return(INIT_FAILED); }
     }

   // Initialize Williams %R
   if(UseWilliamsR)
     {
      hWPR = iWPR(_Symbol, WR_Timeframe, WR_Period);
      if(hWPR == INVALID_HANDLE) { Print("Error: Failed to create WPR indicator handle!"); return(INIT_FAILED); }
     }

   // Initialize AO
   if(UseAO)
     {
      hAO = iAO(_Symbol, AO_Timeframe);
      if(hAO == INVALID_HANDLE) { Print("Error: Failed to create AO indicator handle!"); return(INIT_FAILED); }
     }

   // Initialize Strategy AO + WPR + BB
   if(UseStrategy_ExtReversal)
     {
      hAO_Strat  = iAO(_Symbol, Ext_Timeframe);
      hWPR_Strat = iWPR(_Symbol, Ext_Timeframe, Ext_WPR_Period);
      hEMA_Strat = iMA(_Symbol, Ext_Timeframe, Ext_BB_Period, 0, MODE_EMA, Ext_BB_Price);
      hSTD_Strat = iStdDev(_Symbol, Ext_Timeframe, Ext_BB_Period, 0, MODE_SMA, Ext_BB_Price);

      if(hAO_Strat == INVALID_HANDLE || hWPR_Strat == INVALID_HANDLE || hEMA_Strat == INVALID_HANDLE || hSTD_Strat == INVALID_HANDLE)
        {
         Print("Error: Failed to create Strategy Indicator Handles!");
         return(INIT_FAILED);
        }
     }

   // Initialize Strategy Magics
   magicDG  = InpMagicBase + 1;
   magicLD  = InpMagicBase + 2;
   magicNTM = InpMagicBase + 3;
   magicVT  = InpMagicBase + 4;
   magicCST = InpMagicBase + 5;
   magicRD  = InpMagicBase + 6;

   return(INIT_SUCCEEDED);
  }

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {
   if(hFractals != INVALID_HANDLE) IndicatorRelease(hFractals);
   if(hWPR != INVALID_HANDLE) IndicatorRelease(hWPR);
   if(hAO != INVALID_HANDLE) IndicatorRelease(hAO);
   if(hAO_Strat != INVALID_HANDLE) IndicatorRelease(hAO_Strat);
   if(hWPR_Strat != INVALID_HANDLE) IndicatorRelease(hWPR_Strat);
   if(hEMA_Strat != INVALID_HANDLE) IndicatorRelease(hEMA_Strat);
   if(hSTD_Strat != INVALID_HANDLE) IndicatorRelease(hSTD_Strat);
  }

//+------------------------------------------------------------------+
//| Utils                                                            |
//+------------------------------------------------------------------+
string GetSymbolIcon(string symbol)
{
   string upperSym = symbol;
   StringToUpper(upperSym);
   
   if(StringFind(upperSym, "XAU") >= 0 || StringFind(upperSym, "GOLD") >= 0) return "🏆";
   if(StringFind(upperSym, "BTC") >= 0) return "₿";
   if(StringFind(upperSym, "ETH") >= 0) return "💎";
   
   if(StringFind(upperSym, "EUR") >= 0) return "🇪🇺";
   if(StringFind(upperSym, "GBP") >= 0) return "🇬🇧";
   if(StringFind(upperSym, "JPY") >= 0) return "🇯🇵";
   if(StringFind(upperSym, "USD") >= 0) return "🇺🇸";
   if(StringFind(upperSym, "AUD") >= 0) return "🇦🇺";
   if(StringFind(upperSym, "CAD") >= 0) return "🇨🇦";
   if(StringFind(upperSym, "CHF") >= 0) return "🇨🇭";
   if(StringFind(upperSym, "NZD") >= 0) return "🇳🇿";
   if(StringFind(upperSym, "SGD") >= 0) return "🇸🇬";
   
   return "💱";
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
   double tickval = SymbolInfoDouble(_Symbol,SYMBOL_TRADE_TICK_VALUE);
   double ticksize= SymbolInfoDouble(_Symbol,SYMBOL_TRADE_TICK_SIZE);
   double valuePerPoint = (ticksize>0)? (tickval / ticksize) : 0;
   if(valuePerPoint==0) return 0.0;

   double lots = riskMoney / (stop_points * valuePerPoint);
   double minLot= SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MIN);
   double lotStep= SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_STEP);
   double maxLot= SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MAX);
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
bool Signal_DaoGam(int &dir,double &sl_price,double &tp_price)
{
   dir=0; sl_price=0; tp_price=0;
   double sLow,sHigh;
   int idxLow = FindRecentSwingLow(DG_SwingLeftRight,DG_SwingLeftRight,1,InpLookbackBars,sLow);
   int idxHigh= FindRecentSwingHigh(DG_SwingLeftRight,DG_SwingLeftRight,1,InpLookbackBars,sHigh);
   if(idxLow<0 || idxHigh<0) return false;

   int shift=1; // Use closed bar
   bool falseDown = (iLow(_Symbol,InpSignalTF,shift) < sLow && BullishEngulf(InpSignalTF,shift));
   bool bodyBigUp = BodyFrac(InpSignalTF,shift) >= DG_EngulfBodyFrac;

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

//--------------------------- Strategy: LuuDan --------------------------
bool PromoteTo_LuuDan(int direction)
{
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
bool Signal_NhipThoiMien(int &dir,double &sl_price,double &tp_price)
{
   dir=0; sl_price=0; tp_price=0;
   int hMA = iMA(_Symbol, InpSignalTF, NTM_MA_Period, 0, MODE_EMA, PRICE_CLOSE);
   if(hMA==INVALID_HANDLE) return false;
   double ma[], closep[];
   int bars = MathMin(InpLookbackBars, 1000);
   if(CopyBuffer(hMA,0,0,bars,ma)<=0) return false;
   if(CopyClose(_Symbol, InpSignalTF, 0, bars, closep)<=0) return false;

   int touches=0;
   int lastSide=0; 
   int barsSinceLast=0;
   for(int i=bars-1; i>=1; --i)
   {
      int side = (closep[i] > ma[i])? 1 : -1;
      if(lastSide==0){ lastSide=side; continue; }
      if(side!=lastSide)
      {
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

   int sh=1; // Use closed bar
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

//--------------------------- Strategy: VungToi -------------------------
bool IsMonday(datetime t)
{
   MqlDateTime dt; TimeToStruct(t,dt);
   return dt.day_of_week==1;
}

bool Signal_VungToi(int &dir,double &sl_price,double &tp_price)
{
   dir=0; sl_price=0; tp_price=0;
   MqlDateTime now; TimeToStruct(TimeCurrent(),now);
   int sh=0;
   if(weekOpenTime==0 || TimeToStruct(TimeCurrent(),now)==1) // Simple Reset logic check
   {
      int bars = iBars(_Symbol, PERIOD_H1);
      for(int i=bars-1;i>=0;--i)
      {
         datetime t = iTime(_Symbol,PERIOD_H1,i);
         MqlDateTime d; TimeToStruct(t,d);
         if(d.day_of_week==1 && d.hour==0) { weekOpenTime=t; weekOpenPrice=iOpen(_Symbol,PERIOD_H1,i); break; }
      }
      for(int i=bars-1;i>=0;--i)
      {
         datetime t = iTime(_Symbol,PERIOD_H1,i);
         MqlDateTime d; TimeToStruct(t,d);
         if(d.day_of_week==0 && d.hour==23) { weekPrevCloseTime=t; weekPrevClosePrice=iClose(_Symbol,PERIOD_H1,i); break; }
      }
   }
   if(weekOpenTime==0 || weekPrevCloseTime==0) return false;

   double gapPts = MathAbs(weekOpenPrice - weekPrevClosePrice)/Point();
   if(gapPts > VT_NoGapPointsMax) return false;

   MqlDateTime dt; TimeToStruct(TimeCurrent(),dt);
   if(!IsMonday(TimeCurrent())) return false;
   bool inWin1 = (dt.hour>=VT_Window1_StartHour && dt.hour<VT_Window1_EndHour);
   bool inWin2 = (dt.hour>=VT_Window2_StartHour && dt.hour<VT_Window2_EndHour);
   if(!(inWin1||inWin2)) return false;

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

   double price = SymbolInfoDouble(_Symbol,SYMBOL_BID);
   double distToOpenPts = (price - weekOpenPrice)/Point();

   if(c>o) // Bullish first bar, fade it
   {
      if(distToOpenPts < -VT_ReturnThresholdPoints)
      {
         dir=ORDER_TYPE_SELL;
         sl_price = weekOpenPrice + VT_ReturnThresholdPoints*Point();
         tp_price = weekOpenPrice - VT_TP_Points*Point();
         return true;
      }
   }
   if(c<o) // Bearish first bar, fade it
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

//--------------------------- Strategy: CuaSoThoiGian -------------------
bool CST_TimeWindowOpen()
{
   int N = InpLookbackBars;
   double atr = ATR(InpSignalTF,14,0);
   if(atr<=0) return false;
   double threshold = 1.5*atr; 

   double prev= iClose(_Symbol,InpSignalTF, N-1);
   int lastDir=0; 
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
   int sum=0, cnt=0;
   for(int i=0;i<swingsCount && cnt<CST_MinWavesForAvg; ++i){ sum+=swingBars[i]; cnt++; }
   double avg = (cnt>0)? (double)sum/cnt : 0.0;

   if(barsCurrSwing >= MathMax(CST_MinBarsWindow, (int)MathRound(CST_TriggerFactor*avg)))
      return true;
   return false;
}

//--------------------------- Strategy: Radar ---------------------------
bool IsRoundNumber(double price)
{
   double step = RD_RoundNumberStepPoints*Point();
   double r = fmod(MathAbs(price), step);
   return (r <= 0.2*step || r >= 0.8*step);
}

void GetDailyPivots(int daysBack,double &pp,double &r1,double &s1)
{
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
   double atr = ATR(InpSignalTF,14,0);
   double nearTol = 0.5*atr;
   if(MathAbs(price-pp)<=nearTol || MathAbs(price-r1)<=nearTol || MathAbs(price-s1)<=nearTol) conf++;
   if(MathAbs(price-yHigh)<=nearTol || MathAbs(price-yLow)<=nearTol) conf++;

   if(conf < RD_MinConfluences) return false;

   if(overbought && BearishEngulf(InpSignalTF,0) && BodyFrac(InpSignalTF,0)>=RD_ConfirmBodyFrac)
   {
      dir=ORDER_TYPE_SELL;
      sl_price = iHigh(_Symbol,InpSignalTF,0) + PX_ATR_StopTightenMult*atr;
      double stopPts=(sl_price-price)/Point();
      tp_price = price - DG_TP_R_Mult*stopPts*Point(); 
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

//--------------------------- Trade Functions ---------------------------
bool PlaceOrder(int magic,int dir,double sl,double tp, string tag)
{
   if(!SpreadOK()) return false;
   double entry = (dir==ORDER_TYPE_BUY)? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double stopPts = MathAbs(entry - sl)/Point();
   if(stopPts < 5) return false; 
   double lots = LotsFromRisk(stopPts);
   if(lots <= 0) return false;

   trade.SetExpertMagicNumber(magic);
   trade.SetDeviationInPoints(InpSlippagePoints);
   bool ok=false;
   if(dir==ORDER_TYPE_BUY) ok=trade.Buy(lots,NULL,entry,sl,tp,tag);
   else                    ok=trade.Sell(lots,NULL,entry,sl,tp,tag);
   return ok;
}

void Manage_Runner(int magic,int dir)
{
   if(!LD_KeepRunner) return;
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
      if(profitRun>=R) 
      {
         double newSL = (dir==ORDER_TYPE_BUY)? (pr - LD_Trail_ATR_Mult*atr) : (pr + LD_Trail_ATR_Mult*atr);
         if(dir==ORDER_TYPE_BUY && newSL>sl) trade.PositionModify(_Symbol, newSL, 0);
         if(dir==ORDER_TYPE_SELL && newSL<sl) trade.PositionModify(_Symbol, newSL, 0);
      }
   }
}

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

//+------------------------------------------------------------------+
//| Close All Positions for Symbol                                   |
//+------------------------------------------------------------------+
void CloseAllPositions()
  {
   for(int i=PositionsTotal()-1; i>=0; i--)
     {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket))
        {
         if(PositionGetString(POSITION_SYMBOL) == _Symbol)
           {
            trade.PositionClose(ticket);
            Print("Auto Closed Position ", ticket, " due to Alert.");
           }
        }
     }
  }

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
   // --- 1. EXISTING ALERT LOGIC ---
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   
   if(LastTickBid == 0.0) { LastTickBid = bid; LastTickAsk = ask; return; }
   if(TimeCurrent() - LastAlertTime < AlertCooldown) { LastTickBid = bid; LastTickAsk = ask; return; }

   bool triggerAlert = false;
   string triggerSource = "";

   if(UpperPrice > 0 && LowerPrice > 0)
     {
      if((bid <= UpperPrice && bid >= LowerPrice) || (ask <= UpperPrice && ask >= LowerPrice))
        {
         triggerAlert = true; triggerSource = "Zone Touch";
        }
     }

   if(!triggerAlert && UseTrendlineAlert)
     {
      if(CheckTrendlines(bid, ask, LastTickBid, LastTickAsk, triggerSource)) triggerAlert = true;
     }

   if(!triggerAlert && UsePatternAlert)
     {
      string patternMsg = CheckPatterns();
      if(patternMsg != "") { triggerAlert = true; triggerSource = patternMsg; }
     }

   // 4. Check Williams %R
   if(!triggerAlert && UseWilliamsR)
     {
      string wprMsg = CheckWilliamsR();
      if(wprMsg != "") { triggerAlert = true; triggerSource = wprMsg; }
     }

   // 5. Check AO
   if(!triggerAlert && UseAO)
     {
      string aoMsg = CheckAO();
      if(aoMsg != "") { triggerAlert = true; triggerSource = aoMsg; }
     }

   // 6. Check Strategy Ext Reversal (AO + WPR + BB)
   if(!triggerAlert && UseStrategy_ExtReversal)
     {
      string stratMsg = CheckStrategy_ExtReversal();
      if(stratMsg != "") { triggerAlert = true; triggerSource = stratMsg; }
     }

   if(triggerAlert)
     {
      // AUTO CLOSE LOGIC
      if(AutoCloseOnAlert)
        {
         CloseAllPositions();
        }

      string icon = GetSymbolIcon(_Symbol);
      string message = icon + " " + AlertMessage + "\nSource: " + triggerSource + "\nSymbol: " + _Symbol + "\nPrice: " + DoubleToString(bid, _Digits);
      if(SendDiscordAlert(message)) { LastAlertTime = TimeCurrent(); Print("Discord Alert Sent: ", message); }
      if(UsePushNotification) SendNotification(message);
     }
     
   LastTickBid = bid; LastTickAsk = ask;

   // --- 2. STRATEGY LOGIC (TS AllInOne) ---
   if(Enable_Strategy_Alerts)
   {
      // Check only on Bar Close
      static datetime lastBarTime=0;
      datetime curBarTime = iTime(_Symbol, InpSignalTF, 0);
      bool newBar = (curBarTime != lastBarTime);
      if(!newBar) return; 
      lastBarTime = curBarTime;

      SymbolInfoTick(_Symbol,lastTick);

      int dir; double sl,tp;
      string stratMsg = "";

      // DaoGam
      if(Enable_DaoGam && Signal_DaoGam(dir,sl,tp))
      {
         stratMsg = "[DaoGam] Signal " + ((dir==ORDER_TYPE_BUY)?"BUY":"SELL");
         if(Enable_Auto_Trade && !HasOpenPositionByMagic(magicDG)) 
         {
            if(PlaceOrder(magicDG,dir,sl,tp,"DG")) 
               if(Enable_LuuDan && PromoteTo_LuuDan(dir)) { /* Runner logic implicited in manager */ }
         }
      }

      // NhipThoiMien
      else if(Enable_NhipThoiMien && Signal_NhipThoiMien(dir,sl,tp))
      {
         stratMsg = "[NhipThoiMien] Signal " + ((dir==ORDER_TYPE_BUY)?"BUY":"SELL");
         if(Enable_Auto_Trade && !HasOpenPositionByMagic(magicNTM)) PlaceOrder(magicNTM,dir,sl,tp,"NTM");
      }

      // VungToi
      else if(Enable_VungToi && Signal_VungToi(dir,sl,tp))
      {
         stratMsg = "[VungToi] Signal " + ((dir==ORDER_TYPE_BUY)?"BUY":"SELL");
         if(Enable_Auto_Trade && !HasOpenPositionByMagic(magicVT)) PlaceOrder(magicVT,dir,sl,tp,"VT");
      }

      // Radar
      else if(Enable_Radar && Signal_Radar(dir,sl,tp))
      {
         stratMsg = "[Radar] Signal " + ((dir==ORDER_TYPE_BUY)?"BUY":"SELL");
         if(Enable_Auto_Trade && !HasOpenPositionByMagic(magicRD)) PlaceOrder(magicRD,dir,sl,tp,"RD");
      }
      
      // Cycle Alert
      else if(Enable_CuaSoThoiGian && CST_TimeWindowOpen())
      {
         stratMsg = "[CuaSoThoiGian] Cycle Window Open (Watch for Reversal)";
      }

      // Send Strategy Alert
      if(stratMsg != "")
      {
         string icon = GetSymbolIcon(_Symbol);
         string msg = icon + " STRATEGY ALERT: " + stratMsg + "\nSymbol: " + _Symbol + "\nPrice: " + DoubleToString(bid, _Digits);
         SendDiscordAlert(msg);
         if(UsePushNotification) SendNotification(msg);
      }

      // Manage Trades
      if(Enable_Auto_Trade)
      {
         if(Enable_LuuDan) { Manage_Runner(magicDG,ORDER_TYPE_BUY); Manage_Runner(magicDG,ORDER_TYPE_SELL); }
         Manage_TimeExit(magicDG); Manage_TimeExit(magicNTM);
         Manage_TimeExit(magicVT); Manage_TimeExit(magicRD);
      }
   }
  }

//+------------------------------------------------------------------+
//| Check Patterns                                                   |
//+------------------------------------------------------------------+
string CheckPatterns()
  {
   if(hFractals == INVALID_HANDLE) return "";
   double upFractals[], downFractals[];
   ArraySetAsSeries(upFractals, true); ArraySetAsSeries(downFractals, true);
   if(CopyBuffer(hFractals, 0, 0, PatternLookback, upFractals) <= 0) return "";
   if(CopyBuffer(hFractals, 1, 0, PatternLookback, downFractals) <= 0) return "";
   
   double tolerance = PatternTolerance * SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   // Check Double Top
   int firstTopIdx = -1; double firstTopPrice = 0;
   for(int i = 2; i < PatternLookback; i++) { if(upFractals[i] != 0 && upFractals[i] != EMPTY_VALUE) { firstTopIdx = i; firstTopPrice = upFractals[i]; break; } }
   if(firstTopIdx != -1)
     {
       datetime barTime = iTime(_Symbol, PERIOD_CURRENT, firstTopIdx);
       if(barTime != LastPatternTime)
       {
         for(int i = firstTopIdx + 1; i < PatternLookback; i++) { if(upFractals[i] != 0 && upFractals[i] != EMPTY_VALUE) { if(MathAbs(firstTopPrice - upFractals[i]) <= tolerance) { LastPatternTime = barTime; return "Double Top Detected"; } break; } }
       }
     }
   
   // Check Double Bottom
   int firstBotIdx = -1; double firstBotPrice = 0;
   for(int i = 2; i < PatternLookback; i++) { if(downFractals[i] != 0 && downFractals[i] != EMPTY_VALUE) { firstBotIdx = i; firstBotPrice = downFractals[i]; break; } }
   if(firstBotIdx != -1)
     {
       datetime barTime = iTime(_Symbol, PERIOD_CURRENT, firstBotIdx);
       if(barTime != LastPatternTime)
       {
         for(int i = firstBotIdx + 1; i < PatternLookback; i++) { if(downFractals[i] != 0 && downFractals[i] != EMPTY_VALUE) { if(MathAbs(firstBotPrice - downFractals[i]) <= tolerance) { LastPatternTime = barTime; return "Double Bottom Detected"; } break; } }
       }
     }
   return "";
  }

//+------------------------------------------------------------------+
//| Check Trendlines                                                 |
//+------------------------------------------------------------------+
bool CheckTrendlines(double bid, double ask, double prevBid, double prevAsk, string &outLineName)
  {
   int total = ObjectsTotal(0, 0, -1);
   for(int i = 0; i < total; i++)
     {
      string name = ObjectName(0, i, 0, -1);
      if(StringFind(name, TrendlinePrefix) != 0) continue;
      int type = (int)ObjectGetInteger(0, name, OBJPROP_TYPE);
      
      if(type == OBJ_TREND || type == OBJ_HLINE)
        {
         double priceAtTime = 0.0;
         if(type == OBJ_HLINE) priceAtTime = ObjectGetDouble(0, name, OBJPROP_PRICE);
         else { datetime barTime = iTime(_Symbol, PERIOD_CURRENT, 0); priceAtTime = ObjectGetValueByTime(0, name, barTime, 0); }
         
         double high = iHigh(_Symbol, PERIOD_CURRENT, 0);
         double low  = iLow(_Symbol, PERIOD_CURRENT, 0);
         if(priceAtTime == 0.0) continue;
         if(priceAtTime >= low && priceAtTime <= high) { outLineName = "Line Touch: " + name; return true; }
        }
      else if(type == OBJ_RECTANGLE)
        {
         double price1 = ObjectGetDouble(0, name, OBJPROP_PRICE, 0);
         double price2 = ObjectGetDouble(0, name, OBJPROP_PRICE, 1);
         double top    = MathMax(price1, price2);
         double bottom = MathMin(price1, price2);
         long time1 = ObjectGetInteger(0, name, OBJPROP_TIME, 0);
         long time2 = ObjectGetInteger(0, name, OBJPROP_TIME, 1);
         if(TimeCurrent() < MathMin(time1, time2) || TimeCurrent() > MathMax(time1, time2)) continue;
         
         double high = iHigh(_Symbol, PERIOD_CURRENT, 0);
         double low  = iLow(_Symbol, PERIOD_CURRENT, 0);
         if(low <= top && high >= bottom) { outLineName = "Zone Touch: " + name; return true; }
        }
     }
   return false;
  }

string JsonEscape(string text)
  {
   string result = "";
   int len = StringLen(text);
   for(int i=0; i<len; i++)
     {
      ushort c = StringGetCharacter(text, i);
      switch(c) { case '"': result += "\\\""; break; case '\\': result += "\\\\"; break; case '\n': result += "\\n"; break; case '\r': result += "\\r"; break; case '\t': result += "\\t"; break; default: { string s = " "; StringSetCharacter(s, 0, c); result += s; break; } }
     }
   return result;
  }

bool SendDiscordAlert(string text)
  {
   string content = text;
   if(DiscordMention == MENTION_EVERYONE) content = "@everyone " + content;
   else if(DiscordMention == MENTION_HERE) content = "@here " + content;
   string json = StringFormat("{\"content\": \"%s\", \"tts\": %s}", JsonEscape(content), UseDiscordTTS ? "true" : "false");
   char data[];
   int len = StringToCharArray(json, data, 0, WHOLE_ARRAY, CP_UTF8);
   if(len > 0) ArrayResize(data, len - 1);
   char result[]; string headers = "Content-Type: application/json\r\n"; string result_headers;
   ResetLastError();
   int res = WebRequest("POST", DiscordWebhookUrl, headers, 3000, data, result, result_headers);
   return (res == 200 || res == 204);
  }
//+------------------------------------------------------------------+

//+------------------------------------------------------------------+
//| Check Williams %R Levels                                         |
//+------------------------------------------------------------------+
string CheckWilliamsR()
  {
   if(hWPR == INVALID_HANDLE) return "";
   
   double wpr[];
   ArraySetAsSeries(wpr, true);
   if(CopyBuffer(hWPR, 0, 0, 2, wpr) < 2) return "";
   
   double curr = wpr[0];
   double prev = wpr[1];
   
   // Cross Under Overbought (-20)
   if(prev > WR_Overbought && curr <= WR_Overbought)
      return "Williams %R Cross Below " + DoubleToString(WR_Overbought, 0);
      
   // Cross Above Oversold (-80)
   if(prev < WR_Oversold && curr >= WR_Oversold)
      return "Williams %R Cross Above " + DoubleToString(WR_Oversold, 0);

   return "";
  }

//+------------------------------------------------------------------+
//| Check Awesome Oscillator Zero Cross                              |
//+------------------------------------------------------------------+
string CheckAO()
  {
   if(hAO == INVALID_HANDLE) return "";

   double ao[];
   ArraySetAsSeries(ao, true);
   if(CopyBuffer(hAO, 0, 0, 2, ao) < 2) return "";
   
   double curr = ao[0];
   double prev = ao[1];
   
   // Bullish Cross
   if(prev < 0 && curr >= 0)
      return "AO Bullish Zero Cross";
      
   // Bearish Cross
   if(prev > 0 && curr <= 0)
      return "AO Bearish Zero Cross";

   return "";
  }

//+------------------------------------------------------------------+
//| Strategy: AO + Williams %R + Bollinger Bands EMA                 |
//+------------------------------------------------------------------+
string CheckStrategy_ExtReversal()
  {
   if(hAO_Strat == INVALID_HANDLE || hWPR_Strat == INVALID_HANDLE || hEMA_Strat == INVALID_HANDLE || hSTD_Strat == INVALID_HANDLE) return "";

   double wpr[];
   double ao[];
   double ema[];
   double std_dev[];
   double low[], high[];
   
   ArraySetAsSeries(wpr,true);
   ArraySetAsSeries(ao,true);
   ArraySetAsSeries(ema,true);
   ArraySetAsSeries(std_dev,true);
   ArraySetAsSeries(low,true);
   ArraySetAsSeries(high,true);
   
   // Need 3 bars to check previous AO
   int count = 3;
   
   if(CopyBuffer(hWPR_Strat, 0, 0, count, wpr)<count) return "";
   if(CopyBuffer(hAO_Strat, 0, 0, count, ao)<count) return "";
   if(CopyBuffer(hEMA_Strat, 0, 0, count, ema)<count) return "";
   if(CopyBuffer(hSTD_Strat, 0, 0, count, std_dev)<count) return "";
   if(CopyLow(_Symbol, Ext_Timeframe, 0, count, low)<count) return "";
   if(CopyHigh(_Symbol, Ext_Timeframe, 0, count, high)<count) return "";
   
   // Use Shift 1 (Closed Bar) as signal candle
   int shift = 1;

   // 1. Calculations
   double bb_lower = ema[shift] - (Ext_BB_StdDev * std_dev[shift]);
   double bb_upper = ema[shift] + (Ext_BB_StdDev * std_dev[shift]);
   
   // 2. Buy Setup
   bool buyCondition = (low[shift] <= bb_lower) && 
                       (wpr[shift] < Ext_WPR_OS) && 
                       (ao[shift] > ao[shift+1]); // AO > AO_prev (Green)
                       
   if(buyCondition)
     {
      double ao_val = ao[shift];
      return StringFormat("Buy: Giá Low chạm BB Lower, WPR < %.1f, AO Xanh (%.5f > %.5f)", Ext_WPR_OS, ao[shift], ao[shift+1]);
     }
     
   // 3. Sell Setup
   bool sellCondition = (high[shift] >= bb_upper) && 
                        (wpr[shift] > Ext_WPR_OB) && 
                        (ao[shift] < ao[shift+1]); // AO < AO_prev (Red)
                        
   if(sellCondition)
     {
      return StringFormat("Sell: Giá High chạm BB Upper, WPR > %.1f, AO Đỏ (%.5f < %.5f)", Ext_WPR_OB, ao[shift], ao[shift+1]);
     }
     
   return "";
  }
//+------------------------------------------------------------------+
