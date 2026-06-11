from sklearn.base import BaseEstimator, TransformerMixin
import pandas as pd 
import numpy as np

# Understanding BaseEstimator and TransformerMixin:
# 1. BaseEstimator and TransformerMixin are used to make a custom Python class behave like a real scikit-learn transformer.
# 2. BaseEstimator makes the class compatible with sklearn tools (pipelines, saving/loading, tuning), and TransformerMixin adds fit_transform() automatically.
# 3. Using both ensures the custom transformer works smoothly inside pipelines and during deployment without breaking.

# Class to cap the outliers to find the outliers and cap them between the Min-Max range 
class IQRClipper(BaseEstimator, TransformerMixin):
    def __init__(self):
        pass

    def fit(self, X, y=None):
        self.q1 = np.percentile(X, 25, axis=0)
        self.q3 = np.percentile(X, 75, axis=0)
        self.iqr = self.q3 - self.q1
        return self

    def transform(self, X):
        X_copy = X.copy()
        lower = self.q1 - 1.5 * self.iqr
        upper = self.q3 + 1.5 * self.iqr
        X_clipped = np.clip(X_copy, lower, upper)

        # PRESERVE DATAFRAME
        if isinstance(X, pd.DataFrame):
            return pd.DataFrame(
                X_clipped,
                columns=X.columns,
                index=X.index
            )

        return X_clipped

    def get_feature_names_out(self, input_features=None):
        return input_features
