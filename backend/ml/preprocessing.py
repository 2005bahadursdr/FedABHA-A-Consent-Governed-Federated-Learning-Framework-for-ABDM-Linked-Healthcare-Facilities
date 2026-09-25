import pandas as pd
from sklearn.model_selection import train_test_split
from typing import Tuple

def load_and_preprocess_data(csv_path: str) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Loads dataset, handles missing values, and splits into Train/Val/Test.
    Designed to process isolated hospital data.
    """
    df = pd.read_csv(csv_path)
    
    # Simple imputation if any missing values exist
    df = df.fillna(df.mean(numeric_only=True))
    
    # Stratified split: 70% Train, 15% Val, 15% Test
    # Target: diabetes
    # Use random_state for reproducible non-IID splits in FL
    train_df, temp_df = train_test_split(df, test_size=0.3, stratify=df['diabetes'], random_state=42)
    val_df, test_df = train_test_split(temp_df, test_size=0.5, stratify=temp_df['diabetes'], random_state=42)
    
    return train_df, val_df, test_df
