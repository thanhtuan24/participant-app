import pandas as pd
import pandas_ta as ta
import numpy as np
import itertools
from operator import itemgetter

# Đường dẫn tĩnh tới file CSV đã cung cấp
CSV_FILEPATH = r"c:\Users\Administrator\Documents\Chart_Data\XAUUSD_M1_202603200000_202603251515.csv"

# Thông số Grid Search
# Bạn có thể thêm hoặc điều chỉnh các số này để quét rộng hơn
PARAM_GRID = {
    'willr_length': [7,8,9, 10,11,12,13, 14,15,16,17,18,19,20, 21],
    'price_source': ['open', 'high', 'low', 'close'],
    'bb_length': [15, 20, 30,25, 40, 50, 60, 70, 80, 90, 100],
    'bb_std': [1.5, 2.0, 2.5, 3.0],
    'ao_fast': [5],
    'ao_slow': [34]
}

# Số nến theo dõi sau khi vào lệnh để đo độ đảo chiều (ví dụ 3 nến: nến hiện tại + 2 nến sau)
FORWARD_BARS = 3

def load_data(filepath):
    print(f"Đang tải dữ liệu từ {filepath}...")
    try:
        df = pd.read_csv(filepath, sep=None, engine='python')
    except Exception as e:
        print(f"Lỗi đọc file: {e}")
        return None

    # Tự động map các tên cột (Open, High, Low, Close)
    cols = df.columns.str.lower()
    df.columns = cols
    
    col_mapping = {}
    for c in cols:
        if 'open' in c and 'open' not in col_mapping: col_mapping['open'] = c
        elif 'high' in c and 'high' not in col_mapping: col_mapping['high'] = c
        elif 'low' in c and 'low' not in col_mapping: col_mapping['low'] = c
        elif 'close' in c and 'close' not in col_mapping: col_mapping['close'] = c

    df = df.rename(columns={v: k for k, v in col_mapping.items()})
    
    # Kiểm tra tính hợp lệ
    required_cols = ['open', 'high', 'low', 'close']
    if not all(col in df.columns for col in required_cols):
        print(f"Không tìm thấy đủ các cột cần thiết (Open, High, Low, Close). Các cột hiện tại: {df.columns.tolist()}")
        return None
        
    return df

def run_backtest(df, params):
    willr_len = params['willr_length']
    price_src = params['price_source']
    bb_len = params['bb_length']
    bb_std = params['bb_std']
    ao_f = params['ao_fast']
    ao_s = params['ao_slow']

    # 1. Tính toán Indicators
    
    # Williams %R
    # Tính từ hàm pandas_ta (thường trả về giá trị từ -100 đến 0)
    willr = ta.willr(df['high'], df['low'], df['close'], length=willr_len)
    if willr is None: return None
    df_ta = pd.DataFrame(index=df.index)
    df_ta['willr'] = willr

    # Bollinger Bands (EMA) dựa trên price_source
    ema = ta.ema(df[price_src], length=bb_len)
    std = df[price_src].rolling(window=bb_len).std()
    df_ta['bb_lower'] = ema - (bb_std * std)
    df_ta['bb_upper'] = ema + (bb_std * std)
    
    # Awesome Oscillator
    # AO = SMA(Median Price, 5) - SMA(Median Price, 34)
    ao = ta.ao(df['high'], df['low'], fast=ao_f, slow=ao_s)
    df_ta['ao'] = ao
    df_ta['ao_prev'] = df_ta['ao'].shift(1)

    df_ta['low'] = df['low']
    df_ta['high'] = df['high']
    df_ta['close'] = df['close']

    # 2. Xác định Entry Signals
    # Buy: Low chạm BB Lower & Williams < -80 & AO đổi xanh (AO > AO_prev)
    buy_signals = (df_ta['low'] <= df_ta['bb_lower']) & \
                  (df_ta['willr'] < -80) & \
                  (df_ta['ao'] > df_ta['ao_prev'])
                  
    # Sell: High chạm BB Upper & Williams > -20 & AO đổi đỏ (AO < AO_prev)
    sell_signals = (df_ta['high'] >= df_ta['bb_upper']) & \
                   (df_ta['willr'] > -20) & \
                   (df_ta['ao'] < df_ta['ao_prev'])

    # 3. Đo lường hiệu quả (chỉ trong n nến tiếp theo)
    df_ta['target_high_max'] = df_ta['high'].rolling(window=FORWARD_BARS).max().shift(-FORWARD_BARS + 1)
    df_ta['target_low_min'] = df_ta['low'].rolling(window=FORWARD_BARS).min().shift(-FORWARD_BARS + 1)
    
    # Để đơn giản, giả sử vào lệnh ở giá Close của nến có tín hiệu
    entry_prices = df_ta['close']
    
    buy_indices = np.where(buy_signals)[0]
    sell_indices = np.where(sell_signals)[0]
    
    total_trades = len(buy_indices) + len(sell_indices)
    if total_trades == 0:
        return {'params': params, 'trades': 0, 'score': -999, 'avg_mfe': 0, 'avg_mae': 0}

    total_mfe_pips = 0.0
    total_mae_pips = 0.0
    
    # Tính cho lệnh Buy
    for idx in buy_indices:
        if idx >= len(df) - FORWARD_BARS: continue
        entry_p = entry_prices.iloc[idx]
        max_h = df_ta['target_high_max'].iloc[idx + 1] # Từ nến tiếp theo
        min_l = df_ta['target_low_min'].iloc[idx + 1]
        
        mfe = max_h - entry_p # Lợi nhuận
        mae = entry_p - min_l # Drawdown bị âm xuống
        total_mfe_pips += max(0, mfe)
        total_mae_pips += max(0, mae)

    # Tính cho lệnh Sell
    for idx in sell_indices:
        if idx >= len(df) - FORWARD_BARS: continue
        entry_p = entry_prices.iloc[idx]
        min_l = df_ta['target_low_min'].iloc[idx + 1] # Từ nến tiếp theo
        max_h = df_ta['target_high_max'].iloc[idx + 1]
        
        mfe = entry_p - min_l # Lợi nhuận chiều bán
        mae = max_h - entry_p # Drawdown bị âm lên
        total_mfe_pips += max(0, mfe)
        total_mae_pips += max(0, mae)

    avg_mfe = total_mfe_pips / total_trades
    avg_mae = total_mae_pips / total_trades

    # Điểm đánh giá (Score): tỷ lệ lợi nhuận ngắn hạn / drawdown ngắn hạn. 
    # Cộng thêm xíu penalty nếu drawdown bằng 0 để tránh divide by zero
    score = (avg_mfe * 0.8) - (avg_mae * 1.5)  # Trọng số phạt nặng MAE vì mục tiêu là đảo chiều NGAY

    return {
        'params': params,
        'trades': total_trades,
        'avg_mfe': avg_mfe,
        'avg_mae': avg_mae,
        'score': score
    }

def main():
    keys, values = zip(*PARAM_GRID.items())
    combinations = [dict(zip(keys, v)) for v in itertools.product(*values)]
    
    print(f"Tổng số bộ thông số cần thử nghiệm: {len(combinations)}")
    
    df = load_data(CSV_FILEPATH)
    if df is None: return

    results = []
    
    for idx, params in enumerate(combinations):
        if idx % 10 == 0:
            print(f"Đang xử lý {idx}/{len(combinations)}...")
            
        res = run_backtest(df, params)
        if res and res['trades'] > 0:
            results.append(res)
            
    # Xếp hạng theo điểm Score giảm dần (Hiệu suất đảo chiều ngắn hạn tốt nhất)
    results = sorted(results, key=itemgetter('score'), reverse=True)
    
    print("\n" + "="*50)
    print("🚀 TOP 5 BỘ THÔNG SỐ TỐT NHẤT CHO ĐẢO CHIỀU M1 🚀")
    print("="*50)
    
    for i in range(min(5, len(results))):
        r = results[i]
        p = r['params']
        print(f"Top {i+1}: Score = {r['score']:.4f} | Số lệnh = {r['trades']}")
        print(f"   => Williams Length: {p['willr_length']}")
        print(f"   => Price Source (BB): {p['price_source'].upper()}")
        print(f"   => BB Length (EMA): {p['bb_length']}")
        print(f"   => BB StdDev:       {p['bb_std']}")
        print(f"   => Trạng thái AO (Mặc định): Đổi màu Xanh (Buy) / Đỏ (Sell)")
        print(f"   -> Avg Profit (MFE): {r['avg_mfe']:.2f}")
        print(f"   -> Avg Drawdown (MAE): {r['avg_mae']:.2f}")
        print("-" * 50)

if __name__ == "__main__":
    main()
