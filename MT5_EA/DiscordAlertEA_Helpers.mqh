
//+------------------------------------------------------------------+
//| Check Williams %R Levels                                         |
//+------------------------------------------------------------------+
string CheckWilliamsR()
  {
   if(hWPR == INVALID_HANDLE) return "";
   
   double wpr[];
   ArraySetAsSeries(wpr, true);
   if(CopyBuffer(hWPR, 0, 0, 2, wpr) < 2) return "";
   
   // Index 0: Current (forming), Index 1: Completed
   // Use Index 1 for confirmed signal or Index 0 for instant
   // Let's use Index 0 for "Touch" alert as requested
   double curr = wpr[0];
   double prev = wpr[1];
   
   // Cross Under Overbought (-20)
   if(prev > WR_Overbought && curr <= WR_Overbought)
      return "Williams %R Cross Below " + DoubleToString(WR_Overbought, 0);
      
   // Cross Over Overbought (Re-entry?) - Optional
   if(prev <= WR_Overbought && curr > WR_Overbought)
      return "Williams %R Reach Overbought " + DoubleToString(WR_Overbought, 0);

   // Cross Over Oversold (-80)
   if(prev < WR_Oversold && curr >= WR_Oversold)
      return "Williams %R Cross Above " + DoubleToString(WR_Oversold, 0);
      
   // Cross Under Oversold
   if(prev >= WR_Oversold && curr < WR_Oversold)
      return "Williams %R Reach Oversold " + DoubleToString(WR_Oversold, 0);

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
