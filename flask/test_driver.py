import sys
import unittest

from testing import unit_tests

def main(out = sys.stderr, verbosity = 2):
    suite = unittest.TestLoader().loadTestsFromModule(unit_tests)
    unittest.TextTestRunner(out, verbosity=verbosity).run(suite)

if __name__ == "__main__":
    with open('testing.txt', 'w') as logfile:
        main(logfile)
