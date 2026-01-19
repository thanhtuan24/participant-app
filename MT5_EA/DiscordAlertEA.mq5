//+------------------------------------------------------------------+
//|                                               DiscordAlertEA.mq5 |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "2.00"

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

input group "Alert Settings"
input double             UpperPrice        = 0.0;         // Upper Price Limit (Zone)
input double             LowerPrice        = 0.0;         // Lower Price Limit (Zone)
input bool               UseTrendlineAlert = false;       // Enable Trendline Alert
input string             TrendlinePrefix   = "AlertLine"; // Trendline Name Prefix
input int                AlertCooldown     = 60;          // Cooldown in seconds
input int                TrendlineDeviation= 10;          // Deviation in points (0 = Auto Spread)
input bool               DebugMode         = true;        // Enable Debug Logs

input group "Mobile Settings"
input bool               UsePushNotification = false;     // Send Mobile Push Notification

//--- Global variables
datetime LastAlertTime = 0;
double   LastTickBid   = 0.0;
double   LastTickAsk   = 0.0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
  {
   if(DiscordWebhookUrl == "")
     {
      Print("Error: Discord Webhook URL is empty!");
      return(INIT_FAILED);
     }
     
   if(UpperPrice > 0 && LowerPrice > 0 && UpperPrice <= LowerPrice)
     {
      Print("Error: Upper Price must be greater than Lower Price!");
      return(INIT_FAILED);
     }

   return(INIT_SUCCEEDED);
  }
//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
  {

  }
//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
  {
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

   // Initialize LastTick on first run
   if(LastTickBid == 0.0)
     {
      LastTickBid = bid;
      LastTickAsk = ask;
      return;
     }

   // Check Cooldown
   if(TimeCurrent() - LastAlertTime < AlertCooldown) 
     {
      // Update ticks even during cooldown to maintain continuity
      LastTickBid = bid;
      LastTickAsk = ask;
      return;
     }

   bool triggerAlert = false;
   string triggerSource = "";

   // 1. Check Fixed Zone
   if(UpperPrice > 0 && LowerPrice > 0)
     {
      if((bid <= UpperPrice && bid >= LowerPrice) || (ask <= UpperPrice && ask >= LowerPrice))
        {
         triggerAlert = true;
         triggerSource = "Zone [" + DoubleToString(LowerPrice, _Digits) + " - " + DoubleToString(UpperPrice, _Digits) + "]";
        }
     }

   // 2. Check Trendlines (Crossover Logic)
   if(!triggerAlert && UseTrendlineAlert)
     {
      if(CheckTrendlines(bid, ask, LastTickBid, LastTickAsk, triggerSource))
        {
         triggerAlert = true;
        }
     }

   // Send Alert
   if(triggerAlert)
     {
      string message = AlertMessage + "\nSource: " + triggerSource + "\nSymbol: " + _Symbol + "\nBid: " + DoubleToString(bid, _Digits) + "\nAsk: " + DoubleToString(ask, _Digits);
      
      // Send to Discord
      if(SendDiscordAlert(message))
        {
         LastAlertTime = TimeCurrent();
         Print("Discord Alert Sent: ", message);
        }
      
      // Send to Mobile
      if(UsePushNotification)
        {
         if(SendNotification(message))
           {
            Print("Push Notification Sent.");
           }
         else
           {
            Print("Failed to send Push Notification. Error: ", GetLastError());
           }
        }
     }
     
   // Update Last Ticks
   LastTickBid = bid;
   LastTickAsk = ask;
  }

//+------------------------------------------------------------------+
//| Check Objects (Trendline, HLine, Rectangle)                      |
//+------------------------------------------------------------------+
bool CheckTrendlines(double bid, double ask, double prevBid, double prevAsk, string &outLineName)
  {
   // Scan ALL object types (-1)
   int total = ObjectsTotal(0, 0, -1);
   
   for(int i = 0; i < total; i++)
     {
      string name = ObjectName(0, i, 0, -1);
      
      // Check Name Prefix
      if(StringFind(name, TrendlinePrefix) != 0) continue;
      
      int type = (int)ObjectGetInteger(0, name, OBJPROP_TYPE);
      
      // 1. LINES (Trendline & Horizontal Line)
      if(type == OBJ_TREND || type == OBJ_HLINE)
        {
         double priceAtTime = 0.0;
         
         // Fix: Handle HLINE and TREND separately
         if(type == OBJ_HLINE)
           {
            // Horizontal Line has constant price
            priceAtTime = ObjectGetDouble(0, name, OBJPROP_PRICE);
           }
         else // OBJ_TREND
           {
            // Trendline needs price at specific time
            // Use iTime(0) (Current Bar Open Time) for stability
            datetime barTime = iTime(_Symbol, PERIOD_CURRENT, 0);
            priceAtTime = ObjectGetValueByTime(0, name, barTime, 0);
           }
         
         double high = iHigh(_Symbol, PERIOD_CURRENT, 0);
         double low  = iLow(_Symbol, PERIOD_CURRENT, 0);

         // DEBUG INFO
         if(DebugMode)
           {
             Print("DEBUG: Checking ", name, " (Type: ", type, ") | PriceLine: ", priceAtTime, " | Candle [", low, " - ", high, "]");
           }

         // Error / Invalid Price
         if(priceAtTime == 0.0) 
           {
            if(DebugMode) Print("DEBUG: Line ", name, " ignored (PriceAtTime is 0.0). Error: ", GetLastError());
            continue;
           }

         // Check Candle Intersection Logic
         if(priceAtTime >= low && priceAtTime <= high)
           {
            outLineName = "Line Touch: " + name;
            if(DebugMode) Print(">>> TRIGGER MATCH for ", name);
            return true;
           }
         else
           {
            // if(DebugMode) Print("DEBUG: Line ", name, " did not trigger."); 
           }
        }
      // 2. RECTANGLES (Zones)
      else if(type == OBJ_RECTANGLE)
        {
         double price1 = ObjectGetDouble(0, name, OBJPROP_PRICE, 0);
         double price2 = ObjectGetDouble(0, name, OBJPROP_PRICE, 1);
         double top    = MathMax(price1, price2);
         double bottom = MathMin(price1, price2);
         
         // Helper: Check Time range (optional but good to avoid past zones)
         long time1 = ObjectGetInteger(0, name, OBJPROP_TIME, 0);
         long time2 = ObjectGetInteger(0, name, OBJPROP_TIME, 1);
         long tStart = MathMin(time1, time2);
         long tEnd   = MathMax(time1, time2);
         
         // If current time is outside the box's time range, ignore
         // Note: Users often draw boxes into future, checking TimeCurrent() ensures we are "in" the box horizontally
         if(TimeCurrent() < tStart || TimeCurrent() > tEnd) 
           {
            if(DebugMode) Print("DEBUG: Zone ", name, " ignored (Time mismatch). Current: ", TimeCurrent(), " Zone: ", tStart, "-", tEnd);
            continue;
           }
         
         double high = iHigh(_Symbol, PERIOD_CURRENT, 0);
         double low  = iLow(_Symbol, PERIOD_CURRENT, 0);
         
         if(DebugMode)
             Print("DEBUG: Checking Zone ", name, " | Top: ", top, " Bottom: ", bottom, " | Candle [", low, " - ", high, "]");

         // Check Intersection: Overlap of [Low, High] and [Bottom, Top]
         // Formula: (Low <= Top) && (High >= Bottom)
         if(low <= top && high >= bottom)
           {
            outLineName = "Zone Touch: " + name;
            if(DebugMode) Print(">>> TRIGGER MATCH for Zone ", name);
            return true;
           }
         else
           {
            if(DebugMode) Print("DEBUG: Zone ", name, " did not trigger (Candle not intersecting zone).");
           }
        }
     }
   return false;
  }

//+------------------------------------------------------------------+
//| Helper to escape JSON string                                     |
//+------------------------------------------------------------------+
string JsonEscape(string text)
  {
   string result = "";
   int len = StringLen(text);
   
   for(int i=0; i<len; i++)
     {
      ushort charCode = StringGetCharacter(text, i);
      
      switch(charCode)
        {
         case '"': result += "\\\""; break;
         case '\\': result += "\\\\"; break;
         case '\n': result += "\\n"; break;
         case '\r': result += "\\r"; break;
         case '\t': result += "\\t"; break;
         default:
           {
            string s = " ";
            StringSetCharacter(s, 0, charCode);
            result += s;
            break;
           }
        }
     }
   return result;
  }

//+------------------------------------------------------------------+
//| Send Webhook Request                                             |
//+------------------------------------------------------------------+
bool SendDiscordAlert(string text)
  {
   // Prepare content with Mention
   string content = text;
   if(DiscordMention == MENTION_EVERYONE) content = "@everyone " + content;
   else if(DiscordMention == MENTION_HERE) content = "@here " + content;

   string escapedContent = JsonEscape(content);
   
   // Prepare JSON with TTS option
   string ttsVal = UseDiscordTTS ? "true" : "false";
   string json = StringFormat("{\"content\": \"%s\", \"tts\": %s}", escapedContent, ttsVal);
   
   char data[];
   int len = StringToCharArray(json, data, 0, WHOLE_ARRAY, CP_UTF8);
   
   // Remove null terminator
   if(len > 0) ArrayResize(data, len - 1);
   
   char result[];
   string headers = "Content-Type: application/json\r\n";
   string result_headers;
   
   ResetLastError();
   
   int res = WebRequest("POST", DiscordWebhookUrl, headers, 3000, data, result, result_headers);
   
   if(res == 200 || res == 204) 
     {
      return true;
     }
   else
     {
      Print("WebRequest Error: ", res);
      if(res >= 400 && res < 500)
        {
         string resStr = CharArrayToString(result);
         Print("Server Response: ", resStr);
        }
      return false;
     }
  }
//+------------------------------------------------------------------+
